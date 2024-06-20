import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { triggers } from 'aws-cdk-lib';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { aws_iam as iam} from 'aws-cdk-lib';
import  { aws_s3 as s3 } from 'aws-cdk-lib';
import { DatabaseStack } from './database-stack';
import { GrantDataStack } from './grantdata-stack';

export class DbFetchStack extends cdk.Stack {
  public readonly psycopg2: lambda.LayerVersion;

  constructor(
    scope: cdk.App,
    id: string,
    databaseStack: DatabaseStack,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    /*
      Define Lambda Layers
    */

    // The layer containing the psycopg2 library
    this.psycopg2 = new lambda.LayerVersion(this, 'psycopg2', {
      code: lambda.Code.fromAsset('layers/psycopg2.zip'),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_11],
      description: 'Contains the psycopg2 library',
    });    

    // Create the database tables (runs during deployment)
    const createTables = new triggers.TriggerFunction(this, 'facultyCV-createTables', {
      functionName: 'facultyCV-createTables',
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'createTables.lambda_handler',
      layers: [this.psycopg2],
      code: lambda.Code.fromAsset('lambda/createTables'),
      timeout: cdk.Duration.minutes(15),
      memorySize: 512,
      vpc: databaseStack.dbInstance.vpc, // add to the same vpc as rds
    });
    createTables.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('SecretsManagerReadWrite')
    );
    }
}