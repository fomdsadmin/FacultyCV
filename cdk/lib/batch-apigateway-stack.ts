import { Duration, Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { UserPool } from 'aws-cdk-lib/aws-cognito';

import { ApiStack } from './api-stack';
import { DatabaseStack } from './database-stack';
import { CVGenStack } from './cvgen-stack';
import { OidcAuthStack } from './oidc-auth-stack';

export class BatchApiGatewayStack extends Stack {
  private readonly api: apigateway.RestApi;
  
  public getApiUrl = () => this.api.url;
  public getApi = () => this.api;

  constructor(
    scope: Construct, 
    id: string, 
    apiStack: ApiStack, 
    databaseStack: DatabaseStack, 
    cvGenStack: CVGenStack,
    oidcAuthStack: OidcAuthStack,
    props?: StackProps
  ) {
    super(scope, id, props);

    let resourcePrefix = this.node.tryGetContext('prefix');
    if (!resourcePrefix)
      resourcePrefix = 'facultycv' // Default

    // Create an IAM role for API Gateway to write logs to CloudWatch
    const apiCloudwatchRole = new iam.Role(this, 'BatchApiGatewayCloudWatchRole', {
      roleName: `${resourcePrefix}-batch-api-cloudwatch-role`,
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonAPIGatewayPushToCloudWatchLogs')
      ]
    });

    const gatewayAccount = new apigateway.CfnAccount(this, 'BatchApiGatewayAccount', {
      cloudWatchRoleArn: apiCloudwatchRole.roleArn
    });

    // Create the main API Gateway REST API for batch operations
    this.api = new apigateway.RestApi(this, 'BatchDataAPI', {
      restApiName: `${resourcePrefix}-BatchDataAPI`,
      description: 'API Gateway for triggering batch/bulk data operations',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ['POST', 'GET', 'OPTIONS'],
        allowHeaders: [
          'Content-Type', 
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
          'X-Amz-User-Agent'
        ],
        allowCredentials: true,
      },
      deployOptions: {
        stageName: 'facultycv-batching-stage',
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        throttlingRateLimit: 50,  // Higher limit for batch operations
        throttlingBurstLimit: 20,
      }
    });

    // Add dependency on the API Gateway account
    this.api.deploymentStage.node.addDependency(gatewayAccount);

    // Get the user pool from OIDC stack for authentication
    const userPool = UserPool.fromUserPoolId(this, 'UserPool', oidcAuthStack.getUserPoolId());

    // Create a Cognito authorizer
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'BatchOperationsAuthorizer', {
      cognitoUserPools: [userPool],
      identitySource: apigateway.IdentitySource.header('Authorization'),
      authorizerName: `${resourcePrefix}-BatchOperationsAuthorizer`,
    });

    // Create base resources
    const batchResource = this.api.root.addResource('batch');
    const batchedCVDataResource = batchResource.addResource('addBatchedData');
    const orcidPublicationsResource = batchResource.addResource('getBatchedOrcidPublications');
    const scopusPublicationsResource = batchResource.addResource('getBatchedScopusPublications');
    const totalOrcidPublicationsResource = batchResource.addResource('getTotalOrcidPublications');
    const totalScopusPublicationsResource = batchResource.addResource('getTotalScopusPublications');

    // Get database proxy endpoint from database stack
    const dbProxyEndpoint = databaseStack.rdsProxyEndpoint;

    // Use the resolver role from ApiStack instead of creating a new one
    const batchLambdaRole = apiStack.getResolverRole();

    // Create Lambda function for adding batched user CV data
    const addBatchedUserCVDataFunction = new Function(this, 'AddBatchedUserCVDataFunction', {
      runtime: Runtime.PYTHON_3_9,
      code: Code.fromAsset('lambda/addBatchedUserCVData'),
      handler: 'resolver.lambda_handler',
      timeout: Duration.minutes(15),
      memorySize: 1024,
      role: batchLambdaRole,
      layers: [
        apiStack.getLayers()['psycopg2'],
        apiStack.getLayers()['databaseConnect']
      ],
      environment: {
        DB_PROXY_ENDPOINT: dbProxyEndpoint
      }
    });

    // Create Lambda function for getting batched ORCID publications
    const getOrcidPublicationFunction = new Function(this, 'GetBatchedOrcidPublicationFunction', {
      runtime: Runtime.PYTHON_3_9,
      code: Code.fromAsset('lambda/getOrcidPublication'),
      handler: 'resolver.lambda_handler',
      timeout: Duration.minutes(15),
      memorySize: 1024,
      role: batchLambdaRole,
      layers: [
        apiStack.getLayers()['psycopg2'],
        apiStack.getLayers()['databaseConnect'],
        apiStack.getLayers()['requests']
      ],
      environment: {
        DB_PROXY_ENDPOINT: dbProxyEndpoint
      }
    });

    // Create Lambda function for getting batched Scopus publications
    const getPublicationMatchesFunction = new Function(this, 'GetBatchedPublicationMatchesFunction', {
      runtime: Runtime.PYTHON_3_9,
      code: Code.fromAsset('lambda/getPublicationMatches'),
      handler: 'resolver.lambda_handler',
      timeout: Duration.minutes(15),
      memorySize: 1024,
      role: batchLambdaRole,
      layers: [
        apiStack.getLayers()['psycopg2'],
        apiStack.getLayers()['databaseConnect'],
        apiStack.getLayers()['requests']
      ],
      environment: {
        DB_PROXY_ENDPOINT: dbProxyEndpoint
      }
    });

    // Create Lambda function for getting total ORCID publications
    const getTotalOrcidPublicationsFunction = new Function(this, 'GetTotalOrcidPublicationsFunction', {
      runtime: Runtime.PYTHON_3_9,
      code: Code.fromAsset('lambda/getTotalOrcidPublications'),
      handler: 'resolver.lambda_handler',
      timeout: Duration.minutes(15),
      memorySize: 1024,
      role: batchLambdaRole,
      layers: [
        apiStack.getLayers()['psycopg2'],
        apiStack.getLayers()['databaseConnect'],
        apiStack.getLayers()['requests']
      ],
      environment: {
        DB_PROXY_ENDPOINT: dbProxyEndpoint
      }
    });

    // Create Lambda function for getting total Scopus publications
    const getTotalScopusPublicationsFunction = new Function(this, 'GetTotalScopusPublicationsFunction', {
      runtime: Runtime.PYTHON_3_9,
      code: Code.fromAsset('lambda/getTotalScopusPublications'),
      handler: 'resolver.lambda_handler',
      timeout: Duration.minutes(15),
      memorySize: 1024,
      role: batchLambdaRole,
      layers: [
        apiStack.getLayers()['psycopg2'],
        apiStack.getLayers()['databaseConnect'],
        apiStack.getLayers()['requests']
      ],
      environment: {
        DB_PROXY_ENDPOINT: dbProxyEndpoint
      }
    });

    // Add API Gateway methods and integrations

    // POST /batch/addBatchedData - Add batched CV data
    batchedCVDataResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(addBatchedUserCVDataFunction),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        requestValidator: new apigateway.RequestValidator(this, 'BatchCVDataRequestValidator', {
          restApi: this.api,
          validateRequestBody: true,
          validateRequestParameters: false,
        }),
      }
    );

    // POST /batch/getBatchedOrcidPublications - Get batched ORCID publications
    orcidPublicationsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(getOrcidPublicationFunction),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // POST /batch/getBatchedScopusPublications - Get batched Scopus publications
    scopusPublicationsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(getPublicationMatchesFunction),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // POST /batch/getTotalOrcidPublications - Get total ORCID publications
    totalOrcidPublicationsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(getTotalOrcidPublicationsFunction),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // POST /batch/getTotalScopusPublications - Get total Scopus publications
    totalScopusPublicationsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(getTotalScopusPublicationsFunction),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // Output the API URL
    new CfnOutput(this, 'BatchApiUrl', {
      value: this.api.url,
      description: 'URL of the Batch Operations API Gateway'
    });

    new CfnOutput(this, 'BatchApiId', {
      value: this.api.restApiId,
      description: 'ID of the Batch Operations API Gateway'
    });
  }
}
