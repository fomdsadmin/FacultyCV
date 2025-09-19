import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { triggers } from 'aws-cdk-lib';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { aws_iam as iam} from 'aws-cdk-lib';
import  { aws_s3 as s3 } from 'aws-cdk-lib'
import { aws_stepfunctions as sfn} from 'aws-cdk-lib';
import { aws_stepfunctions_tasks as tasks} from 'aws-cdk-lib';
import { ArnPrincipal, Effect, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { DatabaseStack } from './database-stack';
import { ApiStack } from './api-stack';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';

export class DataFetchStack extends cdk.Stack {

  constructor(
    scope: cdk.App,
    id: string,
    databaseStack: DatabaseStack,
    apiStack: ApiStack,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    let resourcePrefix = this.node.tryGetContext('prefix');
    if (!resourcePrefix)
      resourcePrefix = 'facultycv' // Default

    // Create the S3 Bucket
    const s3Bucket = new s3.Bucket(this, 'facultyCV-user-data-s3-bucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      bucketName: `${resourcePrefix}-${this.account}-user-data-s3-bucket`
    });

    /*
        Create the lambda roles
    */
    const bulkLoadRole = new Role(this, 'CleanBulkUserDataRole', {
        roleName: `${resourcePrefix}-CleanBulkUserDataRole`,
        assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchLogsFullAccess")]
    });
    bulkLoadRole.addToPolicy(new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
            // S3
            "s3:ListBucket",
            "s3:*Object"
        ],
        resources: [s3Bucket.bucketArn]
    }));
    bulkLoadRole.addToPolicy(new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [            
            //Needed to put the Lambda in a VPC
            "ec2:DescribeNetworkInterfaces",
            "ec2:CreateNetworkInterface",
            "ec2:DeleteNetworkInterface",
            "ec2:DescribeInstances",
            "ec2:AttachNetworkInterface"
        ],
        resources: ["*"] // must be *
    }));
    bulkLoadRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        //Secrets Manager
        "secretsmanager:GetSecretValue",
      ],
      resources: [`arn:aws:secretsmanager:${this.region}:${this.account}:secret:facultyCV/credentials/*`]
    }));

    /*
      Define Lambdas and add correct permissions
    */
  
    const bulkUserUpload = new lambda.Function(this, 'facultyCV-bulkUserUpload', {
        functionName: `${resourcePrefix}-bulkUserUpload`,
        runtime: lambda.Runtime.PYTHON_3_9,
        handler: 'lambda_function.lambda_handler',
        code: lambda.Code.fromAsset('lambda/bulkUserUpload'),
        timeout: cdk.Duration.minutes(15),
        role: bulkLoadRole,
        memorySize: 512,
        environment: {
          S3_BUCKET_NAME: s3Bucket.bucketName,
          DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpoint
        },
        vpc: databaseStack.dbCluster.vpc, // add to the same vpc as rds
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        layers: [apiStack.getLayers()['psycopg2'], apiStack.getLayers()['databaseConnect']]
    });

    const bulkTeachingDataUpload = new lambda.Function(this, 'facultyCV-bulkTeachingDataUpload', {
        functionName: `${resourcePrefix}-bulkTeachingDataUpload`,
        runtime: lambda.Runtime.PYTHON_3_9,
        handler: 'lambda_function.lambda_handler',
        code: lambda.Code.fromAsset('lambda/bulkTeachingDataUpload'),
        timeout: cdk.Duration.minutes(15),
        role: bulkLoadRole,
        memorySize: 512,
        environment: {
          S3_BUCKET_NAME: s3Bucket.bucketName,
          DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpoint
        },
        vpc: databaseStack.dbCluster.vpc, // add to the same vpc as rds
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        layers: [apiStack.getLayers()['psycopg2'], apiStack.getLayers()['databaseConnect']]
    });

    const bulkDataSectionsUpload = new lambda.Function(this, 'facultyCV-bulkDataSectionsUpload', {
      functionName: `${resourcePrefix}-bulkDataSectionsUpload`,
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'lambda_function.lambda_handler',
      code: lambda.Code.fromAsset('lambda/bulkDataSectionsUpload'),
      timeout: cdk.Duration.minutes(15),
      role: bulkLoadRole, // assuming the same role can be used
      memorySize: 512,
      environment: {
        S3_BUCKET_NAME: s3Bucket.bucketName,
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpoint
      },
      vpc: databaseStack.dbCluster.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      layers: [apiStack.getLayers()['psycopg2'], apiStack.getLayers()['databaseConnect']]
    });

    const bulkCourseCatalogUpload = new lambda.Function(this, 'facultyCV-bulkCourseCatalogUpload', {
      functionName: `${resourcePrefix}-bulkCourseCatalogUpload`,
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'lambda_function.lambda_handler',
      code: lambda.Code.fromAsset('lambda/bulkCourseCatalogUpload'),
      timeout: cdk.Duration.minutes(15),
      role: bulkLoadRole, // assuming the same role can be used
      memorySize: 512,
      environment: {
        S3_BUCKET_NAME: s3Bucket.bucketName,
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpoint
      },
      vpc: databaseStack.dbCluster.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      layers: [apiStack.getLayers()['psycopg2'], apiStack.getLayers()['databaseConnect']]
    });
    
    const bulkUniversityInfoUpload = new lambda.Function(this, 'facultyCV-bulkUniversityInfoUpload', {
      functionName: `${resourcePrefix}-bulkUniversityInfoUpload`,
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'lambda_function.lambda_handler',
      code: lambda.Code.fromAsset('lambda/bulkUniversityInfoUpload'),
      timeout: cdk.Duration.minutes(15),
      role: bulkLoadRole, // assuming the same role can be used
      memorySize: 512,
      environment: {
        S3_BUCKET_NAME: s3Bucket.bucketName,
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpoint
      },
      vpc: databaseStack.dbCluster.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      layers: [apiStack.getLayers()['psycopg2'], apiStack.getLayers()['databaseConnect']]
    });

    // Add event notifications for the buckets
    s3Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT,
      new LambdaDestination(bulkUserUpload),
      {
        prefix: "user_data/institution_data",
        suffix: ".csv"
      }
    )

    s3Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT,
      new LambdaDestination(bulkDataSectionsUpload),
      {
        prefix: "user_data/data_sections",
        suffix: ".csv"
      }
    )

    s3Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT,
      new LambdaDestination(bulkCourseCatalogUpload),
      {
        prefix: "user_data/course_catalog",
        suffix: ".csv"
      }
    )


    s3Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT,
      new LambdaDestination(bulkUniversityInfoUpload),
      {
        prefix: "user_data/university_info",
        suffix: ".csv"
      }
    )
    
    s3Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT,
      new LambdaDestination(bulkTeachingDataUpload),
      {
        prefix: "user_data/teaching_data",
        suffix: ".csv"
      }
    )

    // Give the lambdas permission to access the S3 Bucket
    s3Bucket.grantReadWrite(bulkUserUpload);
    s3Bucket.grantReadWrite(bulkDataSectionsUpload);
    s3Bucket.grantReadWrite(bulkCourseCatalogUpload);
    s3Bucket.grantReadWrite(bulkUniversityInfoUpload);
    s3Bucket.grantReadWrite(bulkTeachingDataUpload);
  }
}