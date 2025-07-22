import * as cdk from "aws-cdk-lib";
import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { VpcStack } from "./vpc-stack";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { triggers } from "aws-cdk-lib";
import { DatabaseStack } from "./database-stack";
import { Effect, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { LayerVersion } from "aws-cdk-lib/aws-lambda";

export interface UserImportStackProps extends StackProps {
  userPoolId: string;
  psycopgLayer: LayerVersion;
  databaseConnectLayer: LayerVersion;
}

export class UserImportStack extends Stack {

  public readonly userImportS3Bucket: s3.Bucket;
  public readonly manualUploadS3Bucket: s3.Bucket;

  public getUserImportBucketName = () => this.userImportS3Bucket.bucketName;
  public getUserImportBucketArn = () => this.userImportS3Bucket.bucketArn;
  public getManualUploadBucketName = () => this.manualUploadS3Bucket.bucketName;
  public getManualUploadBucketArn = () => this.manualUploadS3Bucket.bucketArn;
  
  constructor(
    scope: Construct,
    id: string,
    vpcStack: VpcStack,
    databaseStack: DatabaseStack,
    userImportProps: UserImportStackProps
  ) {
    super(scope, id, userImportProps);

    let resourcePrefix = this.node.tryGetContext('prefix');
    if (!resourcePrefix)
      resourcePrefix = 'facultycv' // Default

    // Create S3 bucket for user imports
    this.userImportS3Bucket = new s3.Bucket(this, "facultyCV-user-import-s3-bucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      bucketName: `${resourcePrefix}-${Stack.of(this).account}-user-import-s3-bucket`,
      cors: [{
        allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST, s3.HttpMethods.DELETE, s3.HttpMethods.HEAD],
        allowedOrigins: ["http://localhost:3000", "https://dev.360.med.ubc.ca"],
        allowedHeaders: ["*"],
        exposedHeaders: ["ETag"],
        maxAge: 3000
      }]
    });

    // Create S3 bucket for manual uploads of obgyn data
    this.manualUploadS3Bucket = new s3.Bucket(this, "facultyCV-manual-upload-s3-bucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      bucketName: `${resourcePrefix}-${Stack.of(this).account}-manual-upload-s3-bucket`,
      cors: [{
        allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST, s3.HttpMethods.DELETE, s3.HttpMethods.HEAD],
        allowedOrigins: ["http://localhost:3000", "https://dev.360.med.ubc.ca"],
        allowedHeaders: ["*"],
        exposedHeaders: ["ETag"],
        maxAge: 3000
      }]
    });


    // Create folder structure for the user to upload user import files
    const createUserImportFolders = new triggers.TriggerFunction(this, "facultyCV-createUserImportFolders", {
      runtime: lambda.Runtime.PYTHON_3_9,
      functionName: `${resourcePrefix}-createUserImportFolders`,
      handler: "createUserImportFolders.lambda_handler",
      code: lambda.Code.fromAsset("lambda/create-user-import-folders"),
      timeout: cdk.Duration.minutes(1),
      memorySize: 512,
      vpc: vpcStack.vpc,
      environment: {
        BUCKET_NAME: this.userImportS3Bucket.bucketName,
      },
    });

    createUserImportFolders.addToRolePolicy(
      new iam.PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
        resources: [`arn:aws:s3:::${this.userImportS3Bucket.bucketName}/*`],
      })
    );
    createUserImportFolders.executeAfter(this.userImportS3Bucket);

    // Create folder structure for manual uploads (/manual)
    const createManualUploadFolders = new triggers.TriggerFunction(this, "facultyCV-createManualUploadFolders", {
      runtime: lambda.Runtime.PYTHON_3_9,
      functionName: `${resourcePrefix}-createManualUploadFolders`,
      handler: "createUserImportFolders.lambda_handler", // reuse same handler
      code: lambda.Code.fromAsset("lambda/create-user-import-folders"),
      timeout: cdk.Duration.minutes(1),
      memorySize: 512,
      vpc: vpcStack.vpc,
      environment: {
        BUCKET_NAME: this.manualUploadS3Bucket.bucketName,
      },
    });

    createManualUploadFolders.addToRolePolicy(
      new iam.PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
        resources: [`arn:aws:s3:::${this.manualUploadS3Bucket.bucketName}/*`],
      })
    );
    createManualUploadFolders.executeAfter(this.manualUploadS3Bucket);

    // Lambda function to process user import files
    const processUserImport = new lambda.Function(this, "facultyCV-processUserImport", {
        runtime: lambda.Runtime.PYTHON_3_9,
        functionName: `${resourcePrefix}-processUserImport`,
        handler: "lambda_function.lambda_handler",
        code: lambda.Code.fromAsset("lambda/processUserImport"),
        timeout: cdk.Duration.minutes(5),
        memorySize: 512,
        environment: {
            'DB_PROXY_ENDPOINT': databaseStack.rdsProxyEndpoint,
            'USER_POOL_ID': userImportProps.userPoolId,
            'BUCKET_NAME': this.userImportS3Bucket.bucketName
        },
        vpc: vpcStack.vpc,
        vpcSubnets: {
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        layers: [userImportProps.psycopgLayer, userImportProps.databaseConnectLayer]
    });

    // Lambda function to process manual uploads (same code/config as user import, but points to manualUploadS3Bucket)
    const processManualUpload = new lambda.Function(this, "facultyCV-processManualUpload", {
        runtime: lambda.Runtime.PYTHON_3_9,
        functionName: `${resourcePrefix}-processManualUpload`,
        handler: "lambda_function.lambda_handler",
        code: lambda.Code.fromAsset("lambda/processUserImport"), // reuse same code
        timeout: cdk.Duration.minutes(5),
        memorySize: 512,
        environment: {
            'DB_PROXY_ENDPOINT': databaseStack.rdsProxyEndpoint,
            'USER_POOL_ID': userImportProps.userPoolId,
            'BUCKET_NAME': this.manualUploadS3Bucket.bucketName
        },
        vpc: vpcStack.vpc,
        vpcSubnets: {
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        layers: [userImportProps.psycopgLayer, userImportProps.databaseConnectLayer]
    });
    
    // Add S3 permissions for the user import Lambda
    processUserImport.addToRolePolicy(
        new iam.PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
            "s3:GetObject",
            "s3:DeleteObject",
            "s3:ListBucketVersions",
            "s3:ListBucket",
            "s3:ListObjectsV2",
            "s3:ListMultipartUploadParts",
            "s3:ListObjectVersions",
        ],
        resources: [
            `arn:aws:s3:::${this.userImportS3Bucket.bucketName}`,
            `arn:aws:s3:::${this.userImportS3Bucket.bucketName}/*`
        ],
        })
    );
    // Add S3 permissions for the manual upload Lambda
    processManualUpload.addToRolePolicy(
        new iam.PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
            "s3:GetObject",
            "s3:DeleteObject",
            "s3:ListBucketVersions",
            "s3:ListBucket",
            "s3:ListObjectsV2",
            "s3:ListMultipartUploadParts",
            "s3:ListObjectVersions",
        ],
        resources: [
            `arn:aws:s3:::${this.manualUploadS3Bucket.bucketName}`,
            `arn:aws:s3:::${this.manualUploadS3Bucket.bucketName}/*`
        ],
        })
    );

    processUserImport.addToRolePolicy(
        new iam.PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
            "cognito-idp:AdminAddUserToGroup",
        ],
        resources: [`arn:aws:cognito-idp:${Stack.of(this).region}:${Stack.of(this).account}:userpool/*`],
        })
    );
    processManualUpload.addToRolePolicy(
        new iam.PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
            "cognito-idp:AdminAddUserToGroup",
        ],
        resources: [`arn:aws:cognito-idp:${Stack.of(this).region}:${Stack.of(this).account}:userpool/*`],
        })
    );

    processUserImport.addToRolePolicy(
        new iam.PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
            "secretsmanager:GetSecretValue",
        ],
        resources: [`arn:aws:secretsmanager:${Stack.of(this).region}:${Stack.of(this).account}:secret:facultyCV/credentials/*`]
        })
    );
    processManualUpload.addToRolePolicy(
        new iam.PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
            "secretsmanager:GetSecretValue",
        ],
        resources: [`arn:aws:secretsmanager:${Stack.of(this).region}:${Stack.of(this).account}:secret:facultyCV/credentials/*`]
        })
    );

    // Grant permission for S3 to invoke the Lambda
    processUserImport.addPermission("s3-invoke-user-import", {
        principal: new iam.ServicePrincipal("s3.amazonaws.com"),
        action: "lambda:InvokeFunction",
        sourceAccount: Stack.of(this).account,
        sourceArn: this.userImportS3Bucket.bucketArn,
    });
    processManualUpload.addPermission("s3-invoke-manual-upload", {
        principal: new iam.ServicePrincipal("s3.amazonaws.com"),
        action: "lambda:InvokeFunction",
        sourceAccount: Stack.of(this).account,
        sourceArn: this.manualUploadS3Bucket.bucketArn,
    });

    // Add S3 event notifications for user import files
    this.userImportS3Bucket.addEventNotification(
        s3.EventType.OBJECT_CREATED_PUT,
        new s3n.LambdaDestination(processUserImport),
        {
        prefix: "import/",
        suffix: ".csv",
        }
    );

    this.userImportS3Bucket.addEventNotification(
        s3.EventType.OBJECT_CREATED_PUT,
        new s3n.LambdaDestination(processUserImport),
        {
        prefix: "import/",
        suffix: ".xlsx",
        }
    );

    // Add S3 event notifications for manual upload files
    this.manualUploadS3Bucket.addEventNotification(
        s3.EventType.OBJECT_CREATED_PUT,
        new s3n.LambdaDestination(processManualUpload),
        {
        prefix: "import/",
        suffix: ".csv",
        }
    );

    this.manualUploadS3Bucket.addEventNotification(
        s3.EventType.OBJECT_CREATED_PUT,
        new s3n.LambdaDestination(processManualUpload),
        {
        prefix: "import/",
        suffix: ".xlsx",
        }
    );

    // Destroy user import resources when UserImportStack is deleted
    createUserImportFolders.applyRemovalPolicy(RemovalPolicy.DESTROY);
    createManualUploadFolders.applyRemovalPolicy(RemovalPolicy.DESTROY);
    processUserImport.applyRemovalPolicy(RemovalPolicy.DESTROY);
    processManualUpload.applyRemovalPolicy(RemovalPolicy.DESTROY);
  }
}
