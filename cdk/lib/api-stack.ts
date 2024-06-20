import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Architecture, Code, Function, LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Role, ServicePrincipal, ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import * as cognito from 'aws-cdk-lib/aws-cognito';

export class ApiStack extends cdk.Stack {
    private readonly api: appsync.GraphqlApi;
    private readonly userPool: cognito.UserPool;
    private readonly userPoolClient: cognito.UserPoolClient;
    public getEndpointUrl = () => this.api.graphqlUrl;
    public getUserPoolId = () => this.userPool.userPoolId;
    public getUserPoolClientId = () => this.userPoolClient.userPoolClientId;  
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const reportLabLayer = new LayerVersion(this, 'reportLabLambdaLayer', {
        code: Code.fromAsset('./layers/reportlab.zip'),
        compatibleRuntimes: [Runtime.PYTHON_3_11],
        description: 'Lambda layer containing the reportlab Python library'
    });

    const psycopgLayer = new LayerVersion(this, 'psycopgLambdaLayer', {
        code: Code.fromAsset('./layers/psycopg2.zip'),
        compatibleRuntimes: [Runtime.PYTHON_3_11],
        description: 'Lambda layer containing the psycopg2 Python library'
    });

    // Auth
    this.userPool = new cognito.UserPool(this, 'FacultyCVUserPool', {
        userPoolName: 'faculty-cv-user-pool',
        signInAliases: { email: true },
        accountRecovery: cognito.AccountRecovery.EMAIL_ONLY
      });
  
      this.userPoolClient = new cognito.UserPoolClient(this, 'FacultyCVUserPoolClient', {
        userPoolClientName: 'faculty-cv-user-pool-client',
        userPool: this.userPool,
        supportedIdentityProviders: [ cognito.UserPoolClientIdentityProvider.COGNITO ],
        authFlows: {
          userSrp: true
        } 
      });
      
    const assignResolver = (api:appsync.GraphqlApi, fieldName: string, ds: appsync.LambdaDataSource, typeName: string) => {
        new appsync.Resolver(this, 'FacultyCVResolver-' + fieldName, {
            api: api,
            dataSource: ds,
            typeName: typeName,
            fieldName: fieldName
        });
        return;
    }

    const createResolver = (api:appsync.GraphqlApi, directory: string, fieldNames: string[], typeName: string, env: { [key: string]: string }, role: Role, layers: LayerVersion[]) => {
        const resolver = new Function(this, `facultycv-${directory}-resolver`, {
            functionName: `facultycv-${directory}-resolver`,
            runtime: Runtime.PYTHON_3_11,
            memorySize: 512,
            code: Code.fromAsset(`./lambda/${directory}`),
            handler: 'resolver.lambda_handler',
            architecture: Architecture.X86_64,
            timeout: cdk.Duration.minutes(1),
            environment: env,
            role: role,
            layers: layers
        });

        const lambdaDataSource = new appsync.LambdaDataSource(this, `${directory}-data-source`, {
            api: api,
            lambdaFunction: resolver,
            name: `${directory}-data-source`
        });

        fieldNames.forEach(field => assignResolver(api, field, lambdaDataSource, typeName))
    }

    this.api = new appsync.GraphqlApi(this, 'FacultyCVApi', {
        name: 'faculty-cv-api',
        definition: appsync.Definition.fromFile('./graphql/schema.graphql'),
        authorizationConfig: {
            defaultAuthorization: {
                authorizationType: appsync.AuthorizationType.USER_POOL,
                userPoolConfig: {
                    userPool: this.userPool
                }
            }
        },
        logConfig: {
            fieldLogLevel: appsync.FieldLogLevel.ALL
        }
    });

    const resolverRole = new Role(this, 'FacultyCVResolverRole', {
        assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
        roleName: 'facultycv-resolver-role',
        managedPolicies: [
            ManagedPolicy.fromAwsManagedPolicyName('AwsAppSyncInvokeFullAccess'),
            ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess')
        ],
        description: 'IAM role for the lambda resolver function'
    });

    createResolver(this.api, 'sampleResolver', ['getUser'], 'Query', {}, resolverRole, []);
    createResolver(this.api, 'pdfGenerator', ['generatePDF'], 'Mutation', {}, resolverRole, [reportLabLayer]);
    createResolver(this.api, 'addUser', ['addUser'], 'Mutation', {}, resolverRole, [psycopgLayer]);
    }
}
