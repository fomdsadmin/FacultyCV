import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { triggers } from 'aws-cdk-lib';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { aws_iam as iam} from 'aws-cdk-lib';
import  { aws_s3 as s3 } from 'aws-cdk-lib';
import { DatabaseStack } from './database-stack';
import { GrantDataStack } from './grantdata-stack';

export class DataFetchStack extends cdk.Stack {
  public readonly psycopg2: lambda.LayerVersion;
  public readonly pyjarowinkler: lambda.LayerVersion;

  constructor(
    scope: cdk.App,
    id: string,
    databaseStack: DatabaseStack,
    grantDataStack: GrantDataStack,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    // Create the S3 Bucket
    const s3Bucket = new s3.Bucket(this, 'facultyCV-data-s3-bucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    /*
      Define Lambda Layers
    */
    // The layer containing the requests library
    const requests = new lambda.LayerVersion(this, 'requests', {
      code: lambda.Code.fromAsset('layers/requests.zip'),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_9],
      description: 'Contains the requests library',
    });

    // The layer containing the psycopg2 library
    this.psycopg2 = new lambda.LayerVersion(this, 'psycopg2', {
      code: lambda.Code.fromAsset('layers/psycopg2.zip'),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_9],
      description: 'Contains the psycopg2 library',
    });

    // The layer containing the pyjarowinler library
    this.pyjarowinkler = new lambda.LayerVersion(this, 'pyjarowinkler', {
      code: lambda.Code.fromAsset('layers/pyjarowinkler.zip'),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_9],
      description: 'Contains the pyjarowinkler library',
    });

    // The layer containing the pytz library
    const pytz = new lambda.LayerVersion(this, 'pytz', {
      code: lambda.Code.fromAsset('layers/pytz.zip'),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_9],
      description: 'Contains the pytz library, used to get the correct timezone when fetching the date',
    });

    // The layer containing the strsimpy library
    const strsimpy = new lambda.LayerVersion(this, 'strsimpy', {
      code: lambda.Code.fromAsset('layers/strsimpy.zip'),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_9],
      description: 'Contains the strsimpy library, used to perform various string comparison metrics',
    });

    // The layer containing the strsimpy library
    const unicode = new lambda.LayerVersion(this, 'unicode', {
      code: lambda.Code.fromAsset('layers/unicode.zip'),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_9],
      description: 'Contains the unicode library, used to decode unicode',
    });

    // The layer containing the numpy library (AWS Managed)
    const numpy = lambda.LayerVersion.fromLayerVersionArn(
      this,
      'awsNumpyLayer',
      `arn:aws:lambda:${this.region}:336392948345:layer:AWSDataWrangler-Python39:5`
    );

    // Create the database tables (runs during deployment)
    const createTables = new triggers.TriggerFunction(this, 'facultyCV-createTables', {
      functionName: 'facultyCV-createTables',
      runtime: lambda.Runtime.PYTHON_3_9,
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