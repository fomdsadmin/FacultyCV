import { App, BasicAuth, GitHubSourceCodeProvider } from '@aws-cdk/aws-amplify-alpha';
import * as cdk from 'aws-cdk-lib';
import { BuildSpec } from 'aws-cdk-lib/aws-codebuild';
import { Construct } from 'constructs';
import * as yaml from 'yaml';
import { ApiStack } from './api-stack';



export class AmplifyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, apiStack: ApiStack, props?: cdk.StackProps) {
    super(scope, id, props);

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
              - source: </^[^.]+$|.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/>
                target: /
                status: 404
    `);

    const username = cdk.aws_ssm.StringParameter.valueForStringParameter(this, 'facultycv-owner-name');
     
    const amplifyApp = new App(this, 'amplifyApp', {
      appName: 'faculty-cv-amplify',
      sourceCodeProvider: new GitHubSourceCodeProvider({
        owner: username,
        repository: 'FacultyCV',
        oauthToken: cdk.SecretValue.secretsManager('github-access-token-facultyCV', {
          jsonField: 'github-token'
        })
      }),
      environmentVariables: {
        'REACT_APP_AWS_REGION': this.region,
        'REACT_APP_COGNITO_USER_POOL_ID': apiStack.getUserPoolId(),
        'REACT_APP_COGNITO_USER_POOL_CLIENT_ID': apiStack.getUserPoolClientId(),
        'REACT_APP_APPSYNC_ENDPOINT': apiStack.getEndpointUrl()
      },
      buildSpec: BuildSpec.fromObjectToYaml(amplifyYaml),
    });

    amplifyApp.addBranch('main')

  }
}
