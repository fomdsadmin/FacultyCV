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

    // Get allowed origins from environment variables
    const allowedOrigins = [];
    
    // Add origin
    if (process.env.REACT_APP_AMPLIFY_DOMAIN) {
      allowedOrigins.push(process.env.REACT_APP_AMPLIFY_DOMAIN);
    }
    
    // If no environment variables are set, fall back to allowing all origins
    const corsOrigins = allowedOrigins.length > 0 ? allowedOrigins : apigateway.Cors.ALL_ORIGINS;
    
    // For integration responses, use '*' if multiple origins, otherwise use the specific origin
    const corsOriginValue = (allowedOrigins.length === 1) ? `'${allowedOrigins[0]}'` : "'*'";

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

    // Reference existing Lambda functions instead of creating new ones
    const addBatchedUserCVDataFunction = Function.fromFunctionName(
      this, 
      'AddBatchedUserCVDataFunction', 
      `${resourcePrefix}-addBatchedUserCVData-resolver`
    );

    const getOrcidPublicationFunction = Function.fromFunctionName(
      this, 
      'GetOrcidPublicationFunction', 
      `${resourcePrefix}-getOrcidPublication-resolver`
    );

    const getPublicationMatchesFunction = Function.fromFunctionName(
      this, 
      'GetPublicationMatchesFunction', 
      `${resourcePrefix}-getPublicationMatches-resolver`
    );

    const getTotalOrcidPublicationsFunction = Function.fromFunctionName(
      this, 
      'GetTotalOrcidPublicationsFunction', 
      `${resourcePrefix}-getTotalOrcidPublications-resolver`
    );

    const getTotalScopusPublicationsFunction = Function.fromFunctionName(
      this, 
      'GetTotalScopusPublicationsFunction', 
      `${resourcePrefix}-getTotalScopusPublications-resolver`
    );

    // Add API Gateway methods and integrations

    // POST /batch/addBatchedData - Add batched CV data
    batchedCVDataResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(addBatchedUserCVDataFunction, {
        proxy: false,
        integrationResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'"
            }
          }
        ]
      }),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true
            },
            responseModels: {
              'application/json': apigateway.Model.EMPTY_MODEL
            }
          }
        ]
      }
    );

    // OPTIONS /batch/addBatchedData - CORS preflight
    batchedCVDataResource.addMethod(
      'OPTIONS',
      new apigateway.MockIntegration({
        integrationResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
              'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,POST'",
              'method.response.header.Access-Control-Allow-Origin': "'*'"
            }
          }
        ],
        requestTemplates: {
          'application/json': '{"statusCode": 200}'
        }
      }),
      {
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Headers': true,
              'method.response.header.Access-Control-Allow-Methods': true,
              'method.response.header.Access-Control-Allow-Origin': true
            }
          }
        ]
      }
    );

    // POST /batch/getBatchedOrcidPublications - Get batched ORCID publications
    orcidPublicationsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(getOrcidPublicationFunction, {
        proxy: false,
        integrationResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'"
            }
          }
        ]
      }),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true
            },
            responseModels: {
              'application/json': apigateway.Model.EMPTY_MODEL
            }
          }
        ]
      }
    );

    // OPTIONS /batch/getBatchedOrcidPublications - CORS preflight
    orcidPublicationsResource.addMethod(
      'OPTIONS',
      new apigateway.MockIntegration({
        integrationResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
              'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,POST'",
              'method.response.header.Access-Control-Allow-Origin': "'*'"
            }
          }
        ],
        requestTemplates: {
          'application/json': '{"statusCode": 200}'
        }
      }),
      {
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Headers': true,
              'method.response.header.Access-Control-Allow-Methods': true,
              'method.response.header.Access-Control-Allow-Origin': true
            }
          }
        ]
      }
    );

    // POST /batch/getBatchedScopusPublications - Get batched Scopus publications
    scopusPublicationsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(getPublicationMatchesFunction, {
        proxy: false,
        integrationResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'"
            }
          }
        ]
      }),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true
            },
            responseModels: {
              'application/json': apigateway.Model.EMPTY_MODEL
            }
          }
        ]
      }
    );

    // OPTIONS /batch/getBatchedScopusPublications - CORS preflight
    scopusPublicationsResource.addMethod(
      'OPTIONS',
      new apigateway.MockIntegration({
        integrationResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
              'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,POST'",
              'method.response.header.Access-Control-Allow-Origin': "'*'"
            }
          }
        ],
        requestTemplates: {
          'application/json': '{"statusCode": 200}'
        }
      }),
      {
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Headers': true,
              'method.response.header.Access-Control-Allow-Methods': true,
              'method.response.header.Access-Control-Allow-Origin': true
            }
          }
        ]
      }
    );

    // POST /batch/getTotalOrcidPublications - Get total ORCID publications
    totalOrcidPublicationsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(getTotalOrcidPublicationsFunction, {
        proxy: false,
        integrationResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'"
            }
          }
        ]
      }),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true
            },
            responseModels: {
              'application/json': apigateway.Model.EMPTY_MODEL
            }
          }
        ]
      }
    );

    // OPTIONS /batch/getTotalOrcidPublications - CORS preflight
    totalOrcidPublicationsResource.addMethod(
      'OPTIONS',
      new apigateway.MockIntegration({
        integrationResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
              'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,POST'",
              'method.response.header.Access-Control-Allow-Origin': "'*'"
            }
          }
        ],
        requestTemplates: {
          'application/json': '{"statusCode": 200}'
        }
      }),
      {
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Headers': true,
              'method.response.header.Access-Control-Allow-Methods': true,
              'method.response.header.Access-Control-Allow-Origin': true
            }
          }
        ]
      }
    );

    // POST /batch/getTotalScopusPublications - Get total Scopus publications
    totalScopusPublicationsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(getTotalScopusPublicationsFunction, {
        proxy: false,
        integrationResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'"
            }
          }
        ]
      }),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true
            },
            responseModels: {
              'application/json': apigateway.Model.EMPTY_MODEL
            }
          }
        ]
      }
    );

    // OPTIONS /batch/getTotalScopusPublications - CORS preflight
    totalScopusPublicationsResource.addMethod(
      'OPTIONS',
      new apigateway.MockIntegration({
        integrationResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
              'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,POST'",
              'method.response.header.Access-Control-Allow-Origin': "'*'"
            }
          }
        ],
        requestTemplates: {
          'application/json': '{"statusCode": 200}'
        }
      }),
      {
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Headers': true,
              'method.response.header.Access-Control-Allow-Methods': true,
              'method.response.header.Access-Control-Allow-Origin': true
            }
          }
        ]
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
