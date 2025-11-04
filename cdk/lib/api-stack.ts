import * as appsync from "aws-cdk-lib/aws-appsync";
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as wafv2 from "aws-cdk-lib/aws-wafv2";
import { Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Architecture, Code, Function, LayerVersion, Runtime } from "aws-cdk-lib/aws-lambda";
import {
  Role,
  ServicePrincipal,
  ManagedPolicy,
  Policy,
  PolicyStatement,
  PolicyDocument,
  Effect,
} from "aws-cdk-lib/aws-iam";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import { DatabaseStack } from "./database-stack";
import { CVGenStack } from "./cvgen-stack";
import { OidcAuthStack } from "./oidc-auth-stack";

export class ApiStack extends cdk.Stack {
  private readonly api: appsync.GraphqlApi;
  private readonly layerList: { [key: string]: LayerVersion };
  private readonly resolverRole: Role;
  private readonly oidcStack: OidcAuthStack;

  public getEndpointUrl = () => this.api.graphqlUrl;
  public getUserPoolId = () => this.oidcStack.getUserPoolId();
  public getUserPoolClientId = () => this.oidcStack.getUserPoolClientId();
  public getUserPoolDomain = () => this.oidcStack.getUserPoolDomain().domainName;
  public getUserPoolClientName = () => this.oidcStack.getUserPoolClient().userPoolClientName || "oidc-client";
  public getApi = () => this.api;
  public getResolverRole = () => this.resolverRole;
  public addLayer = (name: string, layer: LayerVersion) => (this.layerList[name] = layer);
  public getLayers = () => this.layerList;

  constructor(
    scope: Construct,
    id: string,
    databaseStack: DatabaseStack,
    cvGenStack: CVGenStack,
    oidcStack: OidcAuthStack,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    this.oidcStack = oidcStack;

    let resourcePrefix = this.node.tryGetContext("prefix");
    if (!resourcePrefix) resourcePrefix = "facultycv";

    this.layerList = {};

    const reportLabLayer = new LayerVersion(this, "reportLabLambdaLayer", {
      code: Code.fromAsset("./layers/reportlab.zip"),
      compatibleRuntimes: [Runtime.PYTHON_3_9],
      description: "Lambda layer containing the reportlab Python library",
      layerVersionName: `${resourcePrefix}-reportLabLayer`,
    });

    const psycopgLayer = new LayerVersion(this, "psycopgLambdaLayer", {
      code: Code.fromAsset("./layers/psycopg2.zip"),
      compatibleRuntimes: [Runtime.PYTHON_3_9],
      description: "Lambda layer containing the psycopg2 Python library",
      layerVersionName: `${resourcePrefix}-psycopgLayer`,
    });

    const requestsLayer = new LayerVersion(this, "requestsLambdaLayer", {
      code: Code.fromAsset("./layers/requests.zip"),
      compatibleRuntimes: [Runtime.PYTHON_3_9],
      description: "Lambda layer containing the requests Python library",
      layerVersionName: `${resourcePrefix}-requestLayer`,
    });

    const awsJwtVerifyLayer = new LayerVersion(this, "awsJwtVerifyLambdaLayer", {
      code: Code.fromAsset("./layers/awsJwtVerify.zip"),
      compatibleRuntimes: [Runtime.NODEJS_20_X],
      description: "Lambda layer containing the aws-jwt-verify NodeJS library",
      layerVersionName: `${resourcePrefix}-awsJwtVerifyLayer`,
    });

    const databaseConnectLayer = new LayerVersion(this, "databaseConnectionLambdaLayer", {
      code: Code.fromAsset("./layers/databaseConnect.zip"),
      compatibleRuntimes: [Runtime.PYTHON_3_9],
      description: "Lambda layer containing the database connection",
      layerVersionName: `${resourcePrefix}-databaseConnectLayer`,
    });

    // OpenaAI layer for lambda functions
    const openailayer = new LayerVersion(this, "openaiLayer", {
      code: Code.fromAsset("./layers/openai.zip"),
      compatibleRuntimes: [Runtime.PYTHON_3_9],
      description: "Lambda layer containing the openai Python library",
      layerVersionName: `${resourcePrefix}-openaiLayer`,
    });

    this.layerList["psycopg2"] = psycopgLayer;
    this.layerList["reportlab"] = reportLabLayer;
    this.layerList["requests"] = requestsLayer;
    this.layerList["aws-jwt-verify"] = awsJwtVerifyLayer;
    this.layerList["databaseConnect"] = databaseConnectLayer;
    this.layerList["openai"] = openailayer;

    // AppSync API with both User Pool and API Key authorization
    this.api = new appsync.GraphqlApi(this, "FacultyCVApi", {
      name: `${resourcePrefix}-api`,
      definition: appsync.Definition.fromFile("./graphql/schema.graphql"),
      authorizationConfig: {
        defaultAuthorization: oidcStack.getAppSyncAuthConfig().defaultAuthorization,
        additionalAuthorizationModes: [
          {
            authorizationType: appsync.AuthorizationType.API_KEY,
            // Remove the apiKeyConfig to make it never expire
          },
          {
            authorizationType: appsync.AuthorizationType.IAM, // Add IAM authorization
          },
        ],
      },
      logConfig: {
        fieldLogLevel: appsync.FieldLogLevel.ALL,
      },
    });

    // Explicitly create an API key that never expires
    const apiKey = new appsync.CfnApiKey(this, "FacultyCVApiKey", {
      apiId: this.api.apiId,
      // Remove the expires property to make it never expire
    });

    // Export as output so other stacks can use it
    new cdk.CfnOutput(this, "FacultyCVApiKeyOutput", {
      value: apiKey.attrApiKey,
      exportName: `${resourcePrefix}-ApiKey`,
    });

    // AppSync API Role
    this.resolverRole = new Role(this, "FacultyCVResolverRole", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      roleName: `${resourcePrefix}-resolver-role`,
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName("AwsAppSyncInvokeFullAccess"),
        ManagedPolicy.fromAwsManagedPolicyName("CloudWatchLogsFullAccess"),
        ManagedPolicy.fromAwsManagedPolicyName("SecretsManagerReadWrite"),
      ],
      description: "IAM role for the lambda resolver function",
    });

    // Grant access to Secret Manager
    this.resolverRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          //Secrets Manager
          "secretsmanager:GetSecretValue",
        ],
        resources: [`arn:aws:secretsmanager:${this.region}:${this.account}:secret:*`],
      })
    );

    // Grant access to EC2
    this.resolverRole.addToPolicy(
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
    this.resolverRole.addToPolicy(
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
    this.resolverRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["iam:AddUserToGroup"],
        resources: [`arn:aws:iam::${this.account}:user/*`, `arn:aws:iam::${this.account}:group/*`],
      })
    );

    // Grant permission to add/remove users to a Cognito user group
    this.resolverRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["cognito-idp:AdminAddUserToGroup", "cognito-idp:AdminRemoveUserFromGroup"],
        resources: [`arn:aws:cognito-idp:${this.region}:${this.account}:userpool/${oidcStack.getUserPoolId()}`],
      })
    );

    // Grant permission to get user details from Cognito
    this.resolverRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "cognito-idp:AdminGetUser",
          "cognito-idp:ListUsers",
          "cognito-idp:AdminRemoveUserFromGroup",
          "cognito-idp:AdminAddUserToGroup",
          "cognito-idp:AdminListGroupsForUser",
        ],
        resources: [`arn:aws:cognito-idp:${this.region}:${this.account}:userpool/${oidcStack.getUserPoolId()}`],
      })
    );

    this.resolverRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["s3:*Object", "s3:ListBucket"],
        resources: [cvGenStack.cvS3Bucket.bucketArn + "/*", cvGenStack.cvS3Bucket.bucketArn],
      })
    );

    // Grant S3 permissions for user import bucket (using constructed ARN to avoid circular dependency)
    this.resolverRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["s3:*Object", "s3:ListBucket"],
        resources: [
          `arn:aws:s3:::${resourcePrefix}-${this.account}-user-import-s3-bucket/*`,
          `arn:aws:s3:::${resourcePrefix}-${this.account}-user-import-s3-bucket`,
        ],
      })
    );

    this.resolverRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["dynamodb:*"],
        resources: [cvGenStack.dynamoDBTable.tableArn],
      })
    );

    // Lambda function to delete archived rows
    const deleteArchivedDataLambda = new Function(this, "DeleteArchivedDataLambda", {
      functionName: `${resourcePrefix}-deleteArchivedDataLambda`,
      runtime: Runtime.PYTHON_3_9,
      memorySize: 512,
      code: Code.fromAsset("./lambda/deleteArchivedData"),
      handler: "handler.lambda_handler",
      architecture: Architecture.X86_64,
      timeout: cdk.Duration.minutes(1),
      environment: {
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpoint,
      },
      role: this.resolverRole,
      layers: [psycopgLayer, databaseConnectLayer],
      vpc: databaseStack.dbCluster.vpc, // Same VPC as the database
    });

    // Add permissions for the Lambda function to access the RDS database
    deleteArchivedDataLambda.addToRolePolicy(
      new PolicyStatement({
        actions: ["rds-db:connect"],
        effect: Effect.ALLOW,
        resources: [databaseStack.dbCluster.clusterArn],
      })
    );

    // Schedule the Lambda function to run daily
    const rule = new events.Rule(this, "ScheduleRule", {
      schedule: events.Schedule.rate(cdk.Duration.days(1)),
      ruleName: `${resourcePrefix}-scheduleRule`,
    });

    rule.addTarget(new targets.LambdaFunction(deleteArchivedDataLambda));

    // Waf Firewall
    const waf = new wafv2.CfnWebACL(this, "waf", {
      name: `${resourcePrefix}-waf`,
      description: "waf for Faculty CV",
      scope: "REGIONAL",
      defaultAction: { allow: {} },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: "facultyCV-firewall",
      },
      rules: [
        {
          name: "AWS-AWSManagedRulesCommonRuleSet",
          priority: 1,
          statement: {
            managedRuleGroupStatement: {
              vendorName: "AWS",
              name: "AWSManagedRulesCommonRuleSet",
              ruleActionOverrides: [
                {
                  name: "SizeRestrictions_BODY",
                  actionToUse: {
                    allow: {},
                  },
                },
                {
                  name: "SizeRestrictions_QUERYSTRING",
                  actionToUse: {
                    allow: {},
                  },
                },
              ],
            },
          },
          overrideAction: { none: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: "AWS-AWSManagedRulesCommonRuleSet",
          },
        },
        {
          name: "LimitRequests1000",
          priority: 2,
          action: {
            block: {},
          },
          statement: {
            rateBasedStatement: {
              limit: 1000,
              aggregateKeyType: "IP",
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: "LimitRequests1000",
          },
        },
      ],
    });
    const wafAssociation = new wafv2.CfnWebACLAssociation(this, "waf-association", {
      resourceArn: this.api.arn,
      webAclArn: waf.attrArn,
    });
  }
}
