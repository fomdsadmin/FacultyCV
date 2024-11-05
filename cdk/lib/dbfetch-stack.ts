import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { triggers } from 'aws-cdk-lib';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { aws_iam as iam} from 'aws-cdk-lib';
import  { aws_s3 as s3 } from 'aws-cdk-lib';
import { DatabaseStack } from './database-stack';
import { GrantDataStack } from './grantdata-stack';
import { ApiStack } from './api-stack';
import { LayerVersion } from 'aws-cdk-lib/aws-lambda';

export class DbFetchStack extends cdk.Stack {

  constructor(
    scope: cdk.App,
    id: string,
    databaseStack: DatabaseStack,
    apiStack: ApiStack,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    const psycopgLambdaLayer = apiStack.getLayers()['psycopg2'];
    const databaseConnectLayer = apiStack.getLayers()['databaseConnect']   

    // Create the database tables (runs during deployment)
    const createTables = new triggers.TriggerFunction(this, 'facultyCV-createTables', {
      functionName: 'facultyCV-createTables',
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'createTables.lambda_handler',
      environment: {
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpoint
      },
      layers: [psycopgLambdaLayer, databaseConnectLayer],
      code: lambda.Code.fromAsset('lambda/createTables'),
      timeout: cdk.Duration.minutes(15),
      memorySize: 512,
      vpc: databaseStack.dbCluster.vpc, // add to the same vpc as rds
    });
    createTables.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('SecretsManagerReadWrite')
    );
  }
}