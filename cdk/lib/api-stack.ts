import * as appsync from "aws-cdk-lib/aws-appsync";
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  Architecture,
  Code,
  Function,
  LayerVersion,
  Runtime,
} from "aws-cdk-lib/aws-lambda";
import { Role, ServicePrincipal, ManagedPolicy, Policy, PolicyStatement, PolicyDocument, Effect } from "aws-cdk-lib/aws-iam";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import { DatabaseStack } from "./database-stack";
import { CVGenStack } from "./cvgen-stack";

export class ApiStack extends cdk.Stack {
  private readonly api: appsync.GraphqlApi;
  private readonly userPool: cognito.UserPool;
  private readonly userPoolClient: cognito.UserPoolClient;
  private readonly layerList: { [key: string]: LayerVersion };
  public getEndpointUrl = () => this.api.graphqlUrl;
  public getUserPoolId = () => this.userPool.userPoolId;
  public getUserPoolClientId = () => this.userPoolClient.userPoolClientId;
  public addLayer = (name: string, layer: LayerVersion) =>
    (this.layerList[name] = layer);
  public getLayers = () => this.layerList;
  constructor(scope: Construct, id: string, databaseStack: DatabaseStack, cvGenStack: CVGenStack, props?: cdk.StackProps) {
    super(scope, id, props);

    this.layerList = {};

    const reportLabLayer = new LayerVersion(this, "reportLabLambdaLayer", {
      code: Code.fromAsset("./layers/reportlab.zip"),
      compatibleRuntimes: [Runtime.PYTHON_3_9],
      description: "Lambda layer containing the reportlab Python library",
    });

    const psycopgLayer = new LayerVersion(this, "psycopgLambdaLayer", {
      code: Code.fromAsset("./layers/psycopg2.zip"),
      compatibleRuntimes: [Runtime.PYTHON_3_9],
      description: "Lambda layer containing the psycopg2 Python library",
    });

    const requestsLayer = new LayerVersion(this, "requestsLambdaLayer", {
      code: Code.fromAsset("./layers/requests.zip"),
      compatibleRuntimes: [Runtime.PYTHON_3_9],
      description: "Lambda layer containing the requests Python library"
    });

    const awsJwtVerifyLayer = new LayerVersion(this, "awsJwtVerifyLambdaLayer", {
      code: Code.fromAsset("./layers/awsJwtVerify.zip"),
      compatibleRuntimes: [Runtime.NODEJS_20_X],
      description: "Lambda layer containing the aws-jwt-verify NodeJS library"
    })

    this.layerList["psycopg2"] = psycopgLayer;
    this.layerList["reportlab"] = reportLabLayer;
    this.layerList["requests"] = requestsLayer;
    this.layerList["aws-jwt-verify"] = awsJwtVerifyLayer;

    // Auth
    this.userPool = new cognito.UserPool(this, "FacultyCVUserPool", {
      userPoolName: "faculty-cv-user-pool",
      signInAliases: { email: true },
      autoVerify: {
        email: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      userVerification: {
        emailSubject: "You need to verify your email",
        emailBody:
          "Thanks for signing up for Faculty CV. \n Your verification code is {####}",
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.userPoolClient = new cognito.UserPoolClient(
      this,
      "FacultyCVUserPoolClient",
      {
        userPoolClientName: "faculty-cv-user-pool-client",
        userPool: this.userPool,
        supportedIdentityProviders: [
          cognito.UserPoolClientIdentityProvider.COGNITO,
        ],
        authFlows: {
          userSrp: true,
        },
      }
    );

    // User Groups
    const facultyGroup = new cognito.CfnUserPoolGroup(this, 'FacultyGroup', {
      groupName: 'Faculty',
      userPoolId: this.userPool.userPoolId,
    });

    const assistantGroup = new cognito.CfnUserPoolGroup(this, 'AssistantGroup', {
        groupName: 'Assistant',
        userPoolId: this.userPool.userPoolId,
    });

    const adminGroup = new cognito.CfnUserPoolGroup(this, 'AdminGroup', {
        groupName: 'Admin',
        userPoolId: this.userPool.userPoolId,
    });

    const departmentAdminGroup = new cognito.CfnUserPoolGroup(this, 'DepartmentAdminGroup', {
      groupName: 'DepartmentAdmin',
      userPoolId: this.userPool.userPoolId,
  });

    // GraphQL Resolvers
    const assignResolver = (
      api: appsync.GraphqlApi,
      fieldName: string,
      ds: appsync.LambdaDataSource,
      typeName: string
    ) => {
      new appsync.Resolver(this, "FacultyCVResolver-" + fieldName, {
        api: api,
        dataSource: ds,
        typeName: typeName,
        fieldName: fieldName,
      });
      return;
    };

    const createResolver = (
      api: appsync.GraphqlApi,
      directory: string,
      fieldNames: string[],
      typeName: string,
      env: { [key: string]: string },
      role: Role,
      layers: LayerVersion[],
      runtime: Runtime = Runtime.PYTHON_3_9
    ) => {
      const resolver = new Function(this, `facultycv-${directory}-resolver`, {
        functionName: `facultycv-${directory}-resolver`,
        runtime: runtime,
        memorySize: 512,
        code: Code.fromAsset(`./lambda/${directory}`),
        handler: "resolver.lambda_handler",
        architecture: Architecture.X86_64,
        timeout: cdk.Duration.minutes(1),
        environment: env,
        role: role,
        layers: layers,
        vpc: databaseStack.dbInstance.vpc // Same VPC as the database
      });

      const lambdaDataSource = new appsync.LambdaDataSource(
        this,
        `${directory}-data-source`,
        {
          api: api,
          lambdaFunction: resolver,
          name: `${directory}-data-source`,
        }
      );

      fieldNames.forEach((field) =>
        assignResolver(api, field, lambdaDataSource, typeName)
      );
    };

    this.api = new appsync.GraphqlApi(this, "FacultyCVApi", {
      name: "faculty-cv-api",
      definition: appsync.Definition.fromFile("./graphql/schema.graphql"),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: {
            userPool: this.userPool,
          },
        },
      },
      logConfig: {
        fieldLogLevel: appsync.FieldLogLevel.ALL,
      },
    });

    const resolverRole = new Role(this, "FacultyCVResolverRole", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      roleName: "facultycv-resolver-role",
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName("AwsAppSyncInvokeFullAccess"),
        ManagedPolicy.fromAwsManagedPolicyName("CloudWatchLogsFullAccess"),
        ManagedPolicy.fromAwsManagedPolicyName("SecretsManagerReadWrite")
      ],
      description: "IAM role for the lambda resolver function",
    });

    // Grant access to Secret Manager
    resolverRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          //Secrets Manager
          "secretsmanager:GetSecretValue",
        ],
        resources: [
          `arn:aws:secretsmanager:${this.region}:${this.account}:secret:*`,
        ],
      })
    );

    // Grant access to EC2
    resolverRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses",
        ],
        resources: ["*"], // must be *
      })
    );

    // Grant access to log
    resolverRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          //Logs
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
        resources: ["arn:aws:logs:*:*:*"],
      })
    );

    // Grant permission to add users to an IAM group
    resolverRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
          "iam:AddUserToGroup",
      ],
      resources: [
          `arn:aws:iam::${this.account}:user/*`,
          `arn:aws:iam::${this.account}:group/*`,
      ],
    }));

    // Grant permission to add/remove users to a Cognito user group
    resolverRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
          "cognito-idp:AdminAddUserToGroup",
          "cognito-idp:AdminRemoveUserFromGroup",
      ],
      resources: [
          `arn:aws:cognito-idp:${this.region}:${this.account}:userpool/${this.userPool.userPoolId}`,
      ],
    }));

    // Grant permission to get user details from Cognito
    resolverRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
          "cognito-idp:AdminGetUser",
      ],
      resources: [
          `arn:aws:cognito-idp:${this.region}:${this.account}:userpool/${this.userPool.userPoolId}`,
      ],
    }));

    resolverRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "s3:*Object",
        "s3:ListBucket",
      ],
      resources: [cvGenStack.cvS3Bucket.bucketArn + "/*", cvGenStack.cvS3Bucket.bucketArn]
    }));

    createResolver(
      this.api,
      "addToUserGroup",
      ["addToUserGroup"],
      "Mutation",
      {USER_POOL_ID: this.userPool.userPoolId},
      resolverRole,
      []
    );

    createResolver(
      this.api,
      "removeFromUserGroup",
      ["removeFromUserGroup"],
      "Mutation",
      {USER_POOL_ID: this.userPool.userPoolId},
      resolverRole,
      []
    );

    createResolver(
      this.api,
      "getUser",
      ["getUser"],
      "Query",
      {USER_POOL_ID: this.userPool.userPoolId},
      resolverRole,
      [psycopgLayer]
    );
    createResolver(
      this.api,
      "getAllUsers",
      ["getAllUsers"],
      "Query",
      {},
      resolverRole,
      [psycopgLayer]
    );
    createResolver(
      this.api,
      "getExistingUser",
      ["getExistingUser"],
      "Query",
      {},
      resolverRole,
      [psycopgLayer]
    );
    createResolver(
      this.api,
      "pdfGenerator",
      ["generatePDF"],
      "Mutation",
      {},
      resolverRole,
      [reportLabLayer]
    );
    createResolver(
      this.api,
      "addUser",
      ["addUser"],
      "Mutation",
      {},
      resolverRole,
      [psycopgLayer]
    );
    createResolver(
      this.api,
      "updateUser",
      ["updateUser"],
      "Mutation",
      {},
      resolverRole,
      [psycopgLayer]
    );
    createResolver(
      this.api,
      "getAllSections",
      ["getAllSections"],
      "Query",
      {},
      resolverRole,
      [psycopgLayer]
    );
    createResolver(
      this.api,
      "getArchivedSections",
      ["getArchivedSections"],
      "Query",
      {},
      resolverRole,
      [psycopgLayer]
    );
    createResolver(
      this.api,
      "addSection",
      ["addSection"],
      "Mutation",
      {},
      resolverRole,
      [psycopgLayer]
    );
    createResolver(
      this.api,
      "updateSection",
      ["updateSection"],
      "Mutation",
      {},
      resolverRole,
      [psycopgLayer]
    );
    createResolver(
      this.api,
      "addUserCVData",
      ["addUserCVData"],
      "Mutation",
      {},
      resolverRole,
      [psycopgLayer]
    );
    createResolver(
      this.api,
      "getUserCVData",
      ["getUserCVData"],
      "Query",
      {},
      resolverRole,
      [psycopgLayer]
    )
    createResolver(
      this.api,
      "getArchivedUserCVData",
      ["getArchivedUserCVData"],
      "Query",
      {},
      resolverRole,
      [psycopgLayer]
    )
    createResolver(
      this.api,
      "updateUserCVData",
      ["updateUserCVData"],
      "Mutation",
      {},
      resolverRole,
      [psycopgLayer]
    )
    createResolver(
      this.api,
      "getElsevierAuthorMatches",
      ["getElsevierAuthorMatches"],
      "Query",
      {},
      resolverRole,
      [requestsLayer]
    )
    createResolver(
      this.api,
      "getAllUniversityInfo",
      ["getAllUniversityInfo"],
      "Query",
      {},
      resolverRole,
      [psycopgLayer]
    );
    createResolver(
      this.api,
      "getPresignedUrl",
      ["getPresignedUrl"],
      "Query",
      {
        BUCKET_NAME: cvGenStack.cvS3Bucket.bucketName,
        USER_POOL_ISS: `https://cognito-idp.${this.region}.amazonaws.com/${this.userPool.userPoolId}`,
        CLIENT_ID: this.userPoolClient.userPoolClientId
      },
      resolverRole,
      [awsJwtVerifyLayer],
      Runtime.NODEJS_20_X
    );
    createResolver(
      this.api,
      "getNumberOfGeneratedCVs",
      ["getNumberOfGeneratedCVs"],
      "Query",
      {
        BUCKET_NAME: cvGenStack.cvS3Bucket.bucketName
      },
      resolverRole,
      []
    );
    createResolver(
      this.api,
      "addUniversityInfo",
      ["addUniversityInfo"],
      "Mutation",
      {},
      resolverRole,
      [psycopgLayer]
    );
    createResolver(
      this.api,
      "updateUniversityInfo",
      ["updateUniversityInfo"],
      "Mutation",
      {},
      resolverRole,
      [psycopgLayer]
    );
    createResolver(
      this.api,
      "linkScopusId",
      ["linkScopusId"],
      "Mutation",
      {},
      resolverRole,
      [psycopgLayer]
    );
    createResolver(
      this.api,
      "getOrcidAuthorMatches",
      ["getOrcidAuthorMatches"],
      "Query",
      {},
      resolverRole,
      [requestsLayer]
    );
    createResolver(
      this.api,
      "linkOrcid",
      ["linkOrcid"],
      "Mutation",
      {},
      resolverRole,
      [psycopgLayer]
    );
    createResolver(
      this.api,
      "getUserConnections",
      ["getUserConnections"],
      "Query",
      {},
      resolverRole,
      [psycopgLayer]
    );
    createResolver(
      this.api,
      "addUserConnection",
      ["addUserConnection"],
      "Mutation",
      {},
      resolverRole,
      [psycopgLayer]
    );
    createResolver(
      this.api,
      "updateUserConnection",
      ["updateUserConnection"],
      "Mutation",
      {},
      resolverRole,
      [psycopgLayer]
    );
    createResolver(
      this.api,
      "deleteUserConnection",
      ["deleteUserConnection"],
      "Mutation",
      {},
      resolverRole,
      [psycopgLayer]
    );
    createResolver(
      this.api,
      "getAllTemplates",
      ["getAllTemplates"],
      "Query",
      {},
      resolverRole,
      [psycopgLayer]
    );
    createResolver(
      this.api,
      "addTemplate",
      ["addTemplate"],
      "Mutation",
      {},
      resolverRole,
      [psycopgLayer]
    );
    createResolver(
      this.api,
      "updateTemplate",
      ["updateTemplate"],
      "Mutation",
      {},
      resolverRole,
      [psycopgLayer]
    );
    createResolver(
      this.api,
      "deleteTemplate",
      ["deleteTemplate"],
      "Mutation",
      {},
      resolverRole,
      [psycopgLayer]
    );
    createResolver(
      this.api,
      "getTeachingDataMatches",
      ["getTeachingDataMatches"],
      "Query",
      {},
      resolverRole,
      [psycopgLayer]
    );
    createResolver(
      this.api,
      "getPublicationMatches",
      ["getPublicationMatches"],
      "Query",
      {},
      resolverRole,
      [requestsLayer]
    );
    createResolver(
      this.api,
      "getSecureFundingMatches",
      ["getSecureFundingMatches"],
      "Query",
      {},
      resolverRole,
      [psycopgLayer]
    );
    createResolver(
      this.api,
      "getRiseDataMatches",
      ["getRiseDataMatches"],
      "Query",
      {},
      resolverRole,
      [psycopgLayer]
    );
    createResolver(
      this.api,
      "getPatentMatches",
      ["getPatentMatches"],
      "Query",
      {},
      resolverRole,
      [psycopgLayer]
    );

    // Lambda function to delete archived rows
    const deleteArchivedDataLambda = new Function(this, "DeleteArchivedDataLambda", {
      functionName: "deleteArchivedDataLambda",
      runtime: Runtime.PYTHON_3_9,
      memorySize: 512,
      code: Code.fromAsset("./lambda/deleteArchivedData"),
      handler: "handler.lambda_handler",
      architecture: Architecture.X86_64,
      timeout: cdk.Duration.minutes(1),
      environment: {},
      role: resolverRole,
      layers: [psycopgLayer],
      vpc: databaseStack.dbInstance.vpc // Same VPC as the database
    });

    // Add permissions for the Lambda function to access the RDS database
    deleteArchivedDataLambda.addToRolePolicy(new PolicyStatement({
      actions: [
        "rds-db:connect"
      ],
      effect: Effect.ALLOW,
      resources: [databaseStack.dbInstance.instanceArn]
    }));

    // Schedule the Lambda function to run daily
    const rule = new events.Rule(this, "ScheduleRule", {
      schedule: events.Schedule.rate(cdk.Duration.days(1)),
    });

    rule.addTarget(new targets.LambdaFunction(deleteArchivedDataLambda));

    // Waf Firewall
    const waf = new wafv2.CfnWebACL(this, 'waf', {
      description: 'waf for Faculty CV',
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      visibilityConfig: { 
        sampledRequestsEnabled: true, 
        cloudWatchMetricsEnabled: true,
        metricName: 'facultyCV-firewall'
      },
      rules: [
        {
          name: 'AWS-AWSManagedRulesCommonRuleSet',
          priority: 1,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            }
          },
          overrideAction: { none: {}},
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWS-AWSManagedRulesCommonRuleSet'
          }
        },
        {
          name: 'LimitRequests1000',
          priority: 2,
          action: {
            block: {}
          },
          statement: {
            rateBasedStatement: {
              limit: 1000,
              aggregateKeyType: "IP"
            }
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'LimitRequests1000'
          }
        },
    ]
    })

    const wafAssociation = new wafv2.CfnWebACLAssociation(this, 'waf-association', {
      resourceArn: this.api.arn,
      webAclArn: waf.attrArn
    });

  }
}
