import { App, GitHubSourceCodeProvider } from '@aws-cdk/aws-amplify-alpha';
import * as cdk from 'aws-cdk-lib';
import { BuildSpec } from 'aws-cdk-lib/aws-codebuild';
import { Construct } from 'constructs';
import * as yaml from 'yaml';



export class AmplifyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const amplifyYaml = yaml.parse(`
    version: 1
    applications:
      - frontend:
          phases:
            preBuild:
              commands:
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
          appRoot: frontend
    `);

    const amplifyApp = new App(this, 'amplifyApp', {
      appName: 'faculty-cv-amplify',
      sourceCodeProvider: new GitHubSourceCodeProvider({
        owner: cdk.aws_ssm.StringParameter.valueForStringParameter(this, 'facultycv-owner-name'),
        repository: 'FacultyCV',
        oauthToken: cdk.SecretValue.secretsManager('github-personal-access-token', {
          jsonField: 'github-token'
        })
      }),
      buildSpec: BuildSpec.fromObjectToYaml(amplifyYaml)
    });

  }
}
