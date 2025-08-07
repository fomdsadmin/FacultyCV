import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { UserPool } from 'aws-cdk-lib/aws-cognito';

import { ApiStack } from './api-stack';

export class SupportFormStack extends Stack {
  private api: apigateway.RestApi;

  constructor(scope: Construct, id: string, apiStack: ApiStack, props?: StackProps) {
    super(scope, id, props);

    let resourcePrefix = this.node.tryGetContext('prefix');
    if (!resourcePrefix)
      resourcePrefix = 'facultycv' // Default


    // Create an IAM role for the Lambda function
    const send_email_role = new iam.Role(this, 'SupportForm-SendEmail-Role', {
      roleName: `${resourcePrefix}-sendemail-role`,
      description: 'Role for Lambda function to send emails using Amazon SES and access Secrets Manager',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSESFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ]
    });


    const secret = secretsmanager.Secret.fromSecretNameV2(this, 'SupportEmailSecret', 'support-form-email-config');

    // Allow only GetSecretValue on the support-form-email-config secret
    send_email_role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['secretsmanager:GetSecretValue'],
      resources: [`${secret.secretArn}*`]     // handle ARN suffix /stage/*
    }));

    
    // Define the Lambda function responsible for handling email sending logic via SES
    const sendEmail = new Function(this, 'SupportFormSendEmail', {
      runtime: Runtime.PYTHON_3_12,
      code: Code.fromAsset('lambda/sendEmail'),
      handler: 'resolver.lambda_handler',
      timeout: Duration.seconds(60),
      role: send_email_role
    });

    // Create an IAM role for API Gateway to write logs to CloudWatch
    const apiCloudwatchRole = new iam.Role(this, 'ApiGatewayCloudWatchRole', {
      roleName: `${resourcePrefix}-api-cloudwatch-role`,
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonAPIGatewayPushToCloudWatchLogs')
      ]
    });

    const gatewayAccount = new apigateway.CfnAccount(this, 'ApiGatewayAccount', {
      cloudWatchRoleArn: apiCloudwatchRole.roleArn
    })


    // Create an API Gateway REST API with CORS support and enable CloudWatch metrics and logging + rate limiting
    this.api = new apigateway.RestApi(this, 'SupportFormSendEmailAPI', {
      restApiName: `${resourcePrefix}-SupportFormSendEmailService`,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ['POST'],
      },
      deployOptions: {
      stageName: 'prod',
      metricsEnabled: true,              // Enable CloudWatch metrics
      loggingLevel: apigateway.MethodLoggingLevel.INFO,  // INFO or ERROR
      dataTraceEnabled: true,            // Full request/response logs
      throttlingRateLimit: 20,
      throttlingBurstLimit: 5,
      }
    });

    // Add dependency on the API Gateway account to ensure it is created before the deployment stage
    this.api.deploymentStage.node.addDependency(gatewayAccount);


    // Use the user pool from the passed ApiStack.ts
    const cognito_userPoolId = apiStack.getUserPoolId();
    const userPool = UserPool.fromUserPoolId(this, 'UserPool', cognito_userPoolId);

    // Create a /send-email path in the API
    const emailResource = this.api.root.addResource('send-email');

    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [userPool],
      identitySource: apigateway.IdentitySource.header('Authorization'), // Use Authorization header
      authorizerName: `${resourcePrefix}-SendEmailAuthorizer`,
    });


    // Attach POST method to /send-email path with Cognito authorizer
    emailResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(sendEmail),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

  }

  public getApiUrl(): string {
    return this.api.url;
  }
}
