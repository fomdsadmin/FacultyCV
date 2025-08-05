import { App, BasicAuth, GitHubSourceCodeProvider } from '@aws-cdk/aws-amplify-alpha';
import * as cdk from 'aws-cdk-lib';
import { BuildSpec } from 'aws-cdk-lib/aws-codebuild';
import { Construct } from 'constructs';
import * as yaml from 'yaml';
import { ApiStack } from './api-stack';
import { OidcAuthStack } from './oidc-auth-stack';
import { BatchApiGatewayStack } from './batch-apigateway-stack';

export class AmplifyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, apiStack: ApiStack, oidcStack: OidcAuthStack, batchApiStack: BatchApiGatewayStack, props?: cdk.StackProps) {
    super(scope, id, props);

    let resourcePrefix = this.node.tryGetContext('prefix');
    if (!resourcePrefix)
      resourcePrefix = 'facultycv' // Default

    // Amplify
    const amplifyYaml = yaml.parse(`
    version: 1
    applications:
      - appRoot: frontend
        frontend:
          phases:
            preBuild:
              commands:
                - pwd
                - npm ci
            build:
              commands:
                - npm run build
          artifacts:
            baseDirectory: build
            files:
              - '**/*'
          cache:
            paths:
              - 'node_modules/**/*'
          redirects:
              - source: </^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/>
                target: /index.html
                status: 200
    `);

    const username = cdk.aws_ssm.StringParameter.valueForStringParameter(this, 'facultycv-owner-name');
     
    const amplifyApp = new App(this, 'amplifyApp', {
      appName: `${resourcePrefix}-amplify`,
      sourceCodeProvider: new GitHubSourceCodeProvider({
        owner: username,
        repository: 'FacultyCV',
        oauthToken: cdk.SecretValue.secretsManager('github-access-token-facultyCV', {
          jsonField: 'github-token'
        })
      }),
      environmentVariables: {
        'REACT_APP_AWS_REGION': this.region,
        'REACT_APP_COGNITO_USER_POOL_ID': oidcStack.getUserPoolId(),
        'REACT_APP_COGNITO_USER_POOL_CLIENT_ID': oidcStack.getUserPoolClientId(),
        'REACT_APP_APPSYNC_ENDPOINT': apiStack.getEndpointUrl(),
        'REACT_APP_BATCH_API_BASE_URL': batchApiStack.getApiUrl(),
        'REACT_APP_AMPLIFY_DOMAIN': 'https://dev.360.med.ubc.ca',
        'REACT_APP_COGNITO_CLIENT_NAME': 'facultycv-dev',
        'REACT_APP_COGNITO_DOMAIN': oidcStack.getUserPoolDomainUrl(),
        'REACT_APP_KEYCLOAK_LOGOUT_URL': 'https://broker.id.ubc.ca/auth/realms/idb2/protocol/openid-connect/logout',
        'REACT_APP_REDIRECT_URL': 'https://dev.360.med.ubc.ca/auth'
      },
      buildSpec: BuildSpec.fromObjectToYaml(amplifyYaml),
    });

    amplifyApp.addBranch('main')

  }
}
