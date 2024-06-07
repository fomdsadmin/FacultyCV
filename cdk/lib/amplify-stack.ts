import { App, BasicAuth, GitHubSourceCodeProvider } from '@aws-cdk/aws-amplify-alpha';
import * as cdk from 'aws-cdk-lib';
import { BuildSpec } from 'aws-cdk-lib/aws-codebuild';
import { Construct } from 'constructs';
import * as yaml from 'yaml';
import * as cognito from 'aws-cdk-lib/aws-cognito';



export class AmplifyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Auth
    const userPool = new cognito.UserPool(this, 'FacultyCVUserPool', {
      userPoolName: 'faculty-cv-user-pool',
      signInAliases: { email: true },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'FacultyCVUserPoolClient', {
      userPoolClientName: 'faculty-cv-user-pool-client',
      userPool: userPool,
      supportedIdentityProviders: [ cognito.UserPoolClientIdentityProvider.COGNITO ],
      authFlows: {
        userSrp: true
      } 
    });

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
    `);

    const username = cdk.aws_ssm.StringParameter.valueForStringParameter(this, 'facultycv-owner-name');
     
    const amplifyApp = new App(this, 'amplifyApp', {
      appName: 'faculty-cv-amplify',
      sourceCodeProvider: new GitHubSourceCodeProvider({
        owner: username,
        repository: 'FacultyCV',
        oauthToken: cdk.SecretValue.secretsManager('github-access-token', {
          jsonField: 'github-token'
        })
      }),
      environmentVariables: {
        'REACT_APP_AWS_REGION': this.region,
        'REACT_APP_COGNITO_USER_POOL_ID': userPool.userPoolId,
        'REACT_APP_COGNITO_USER_POOL_CLIENT_ID': userPoolClient.userPoolClientId
      },
      buildSpec: BuildSpec.fromObjectToYaml(amplifyYaml),
    });

    amplifyApp.addBranch('amplify-cdk')

  }
}
