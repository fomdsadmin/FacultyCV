import * as cdk from "aws-cdk-lib";
import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { VpcStack } from "./vpc-stack";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as iam from "aws-cdk-lib/aws-iam";
import * as glue from "aws-cdk-lib/aws-glue";
import * as sm from "aws-cdk-lib/aws-secretsmanager";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { triggers } from "aws-cdk-lib";
import { DatabaseStack } from "./database-stack";
import { Effect, ServicePrincipal } from "aws-cdk-lib/aws-iam";

export class GrantDataStack extends Stack {

  public readonly glueS3Bucket: s3.Bucket;

  constructor(
    scope: Construct,
    id: string,
    vpcStack: VpcStack,
    databaseStack: DatabaseStack,
    props?: StackProps
  ) {
    super(scope, id, props);

    // Create new Glue Role. DO NOT RENAME THE ROLE!!!
    const roleName = "AWSGlueServiceRole-ShellJob";
    const glueRole = new iam.Role(this, roleName, {
      assumedBy: new iam.ServicePrincipal("glue.amazonaws.com"),
      description: "Glue Service Role for Grant ETL",
      roleName: roleName,
    });

    // Add different policies to glue-service-role
    const glueServiceRolePolicy = iam.ManagedPolicy.fromAwsManagedPolicyName(
      "service-role/AWSGlueServiceRole"
    );
    const glueConsoleFullAccessPolicy =
      iam.ManagedPolicy.fromAwsManagedPolicyName("AWSGlueConsoleFullAccess");
    const glueSecretManagerPolicy = iam.ManagedPolicy.fromAwsManagedPolicyName(
      "SecretsManagerReadWrite"
    );
    const glueAmazonS3FullAccessPolicy =
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess");

    glueRole.addManagedPolicy(glueServiceRolePolicy);
    glueRole.addManagedPolicy(glueConsoleFullAccessPolicy);
    glueRole.addManagedPolicy(glueSecretManagerPolicy);
    glueRole.addManagedPolicy(glueAmazonS3FullAccessPolicy);

    // Create S3 bucket for Glue Job scripts/data
    this.glueS3Bucket = new s3.Bucket(this, "facultyCV-glue-s3-bucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: false,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // Create S3 bucket for the grant data
    const grantDataS3Bucket = new s3.Bucket(this, "facultyCV-grant-data-s3-bucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // Create folder structure for the user to upload grant CSV files
    const createFolders = new triggers.TriggerFunction(this, "facultyCV-createFolders", {
      runtime: lambda.Runtime.PYTHON_3_11,
      functionName: "facultyCV-createFolders",
      handler: "createGrantFolders.lambda_handler",
      code: lambda.Code.fromAsset("lambda/create-grant-folders"),
      timeout: cdk.Duration.minutes(1),
      memorySize: 512,
      vpc: vpcStack.vpc,
      environment: {
        BUCKET_NAME: grantDataS3Bucket.bucketName,
      },
    });

    createFolders.addToRolePolicy(
      new iam.PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
        resources: [`arn:aws:s3:::${grantDataS3Bucket.bucketName}/*`],
      })
    );
    createFolders.executeAfter(grantDataS3Bucket);

    // Lambda function to trigger Glue jobs
    const glueTrigger = new lambda.Function(this, "facultyCV-s3-glue-trigger", {
        runtime: lambda.Runtime.PYTHON_3_11,
        functionName: "facultyCV-s3-glue-trigger",
        handler: "s3GlueTrigger.lambda_handler",
        code: lambda.Code.fromAsset("lambda/s3-glue-trigger"),
        timeout: cdk.Duration.minutes(1),
        memorySize: 512,
        vpc: vpcStack.vpc,
    });
    
    glueTrigger.addToRolePolicy(
        new iam.PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
            "glue:GetJob",
            "glue:GetJobs",
            "glue:GetJobRun",
            "glue:GetJobRuns",
            "glue:StartJobRun",
            "glue:UpdateJob"
        ],
        resources: [
            "*" // DO NOT CHANGE
        ],
        })
    );
    
    glueTrigger.addToRolePolicy(
        new iam.PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
            "s3:ListBucketVersions",
            "s3:ListBucket",
            "s3:ListObjectsV2",
            "s3:ListMultipartUploadParts",
            "s3:ListObjectVersions",
        ],
        resources: [
            `arn:aws:s3:::${grantDataS3Bucket.bucketName}`,
            `arn:aws:s3:::${grantDataS3Bucket.bucketName}/*`
        ],
        })
    );
    
    // Grant permission for s3 to invoke lambda
    glueTrigger.addPermission("s3-invoke", {
        principal: new iam.ServicePrincipal("s3.amazonaws.com"),
        action: "lambda:InvokeFunction",
        sourceAccount: this.account,
        sourceArn: grantDataS3Bucket.bucketArn,
    });
    
    // Raw cihr data
    grantDataS3Bucket.addEventNotification(
        s3.EventType.OBJECT_CREATED_PUT,
        new s3n.LambdaDestination(glueTrigger),
        {
        prefix: "raw/cihr",
        suffix: ".csv",
        }
    );
    
    // Clean cihr data
    grantDataS3Bucket.addEventNotification(
        s3.EventType.OBJECT_CREATED_PUT,
        new s3n.LambdaDestination(glueTrigger),
        {
        prefix: "clean/cihr",
        suffix: ".csv",
        }
    );
    
    // IDs-assigned cihr data
    grantDataS3Bucket.addEventNotification(
        s3.EventType.OBJECT_CREATED_PUT,
        new s3n.LambdaDestination(glueTrigger),
        {
        prefix: "ids-assigned/cihr",
        suffix: ".csv",
        }
    );

    // Raw NSERC data
    grantDataS3Bucket.addEventNotification(
        s3.EventType.OBJECT_CREATED_PUT,
        new s3n.LambdaDestination(glueTrigger),
        {
        prefix: "raw/nserc",
        suffix: ".csv",
        }
    );
    
    // Clean NSERC data
    grantDataS3Bucket.addEventNotification(
        s3.EventType.OBJECT_CREATED_PUT,
        new s3n.LambdaDestination(glueTrigger),
        {
        prefix: "clean/nserc",
        suffix: ".csv",
        }
    );
    
    // IDs-assigned NSERC data
    grantDataS3Bucket.addEventNotification(
        s3.EventType.OBJECT_CREATED_PUT,
        new s3n.LambdaDestination(glueTrigger),
        {
        prefix: "ids-assigned/nserc",
        suffix: ".csv",
        }
    );
    
    // Raw SSHRC data
    grantDataS3Bucket.addEventNotification(
        s3.EventType.OBJECT_CREATED_PUT,
        new s3n.LambdaDestination(glueTrigger),
        {
        prefix: "raw/sshrc",
        suffix: ".csv",
        }
    );
    
    // Clean SSHRC data
    grantDataS3Bucket.addEventNotification(
        s3.EventType.OBJECT_CREATED_PUT,
        new s3n.LambdaDestination(glueTrigger),
        {
        prefix: "clean/sshrc",
        suffix: ".csv",
        }
    );
    
    // IDs-assigned SSHRC data
    grantDataS3Bucket.addEventNotification(
        s3.EventType.OBJECT_CREATED_PUT,
        new s3n.LambdaDestination(glueTrigger),
        {
        prefix: "ids-assigned/sshrc",
        suffix: ".csv",
        }
    );
    
    // Raw CFI data
    grantDataS3Bucket.addEventNotification(
        s3.EventType.OBJECT_CREATED_PUT,
        new s3n.LambdaDestination(glueTrigger),
        {
        prefix: "raw/cfi",
        suffix: ".csv",
        }
    );
    
    // Clean CFI data
    grantDataS3Bucket.addEventNotification(
        s3.EventType.OBJECT_CREATED_PUT,
        new s3n.LambdaDestination(glueTrigger),
        {
        prefix: "clean/cfi",
        suffix: ".csv",
        }
    );
    
    // IDs-assigned CFI data
    grantDataS3Bucket.addEventNotification(
        s3.EventType.OBJECT_CREATED_PUT,
        new s3n.LambdaDestination(glueTrigger),
        {
        prefix: "ids-assigned/cfi",
        suffix: ".csv",
        }
    );

    // Raw Rise data
    grantDataS3Bucket.addEventNotification(
        s3.EventType.OBJECT_CREATED_PUT,
        new s3n.LambdaDestination(glueTrigger),
        {
        prefix: "raw/rise",
        suffix: ".csv",
        }
    );
    
    // Clean Rise data
    grantDataS3Bucket.addEventNotification(
        s3.EventType.OBJECT_CREATED_PUT,
        new s3n.LambdaDestination(glueTrigger),
        {
        prefix: "clean/rise",
        suffix: ".csv",
        }
    );
    
    const securityGroup = new ec2.SecurityGroup(this, "glueSecurityGroup", {
        vpc: vpcStack.vpc,
        allowAllOutbound: true,
        description: "Self-referencing security group for Glue",
        securityGroupName: "default-glue-security-group",
    });
    // add self-referencing ingress rule
    securityGroup.addIngressRule(
        securityGroup,
        ec2.Port.allTcp(),
        "self-referencing security group rule"
    );
    
    // Create a Connection to the PostgreSQL database inside the VPC
    const gluePostgresConnectionName = "postgres-conn";
    
    const postgresConnectionProps: { [key: string]: any } = {
        KAFKA_SSL_ENABLED: "false",
    };
    
    const gluePostgresConnection = new glue.CfnConnection(
        this,
        gluePostgresConnectionName,
        {
        catalogId: this.account, // this AWS account ID
        connectionInput: {
            name: gluePostgresConnectionName,
            description: "a connection to the PostgreSQL database for Glue",
            connectionType: "NETWORK",
            connectionProperties: postgresConnectionProps,
            physicalConnectionRequirements: {
            availabilityZone: vpcStack.availabilityZones[0],
            securityGroupIdList: [securityGroup.securityGroupId],
            subnetId: databaseStack.dbInstance.vpc.isolatedSubnets[0].subnetId,
            },
        },
        }
    );
    
    // define a Glue Python Shell Job to clean the raw grant data
    const PYTHON_VER = "3.9";
    const GLUE_VER = "3.0";
    const MAX_RETRIES = 0; // no retries, only execute once
    const MAX_CAPACITY = 0.0625; // 1/16 of a DPU, lowest setting
    const MAX_CONCURRENT_RUNS = 7; // 7 concurrent runs of the same job simultaneously
    const TIMEOUT = 120; // 120 min timeout duration
    const defaultArguments = {
        "library-set": "analytics",
        "--SECRET_NAME": databaseStack.secretPath,
        "--BUCKET_NAME": grantDataS3Bucket.bucketName,
        "--additional-python-modules": "psycopg2-binary"
    };
    
    // Glue Job: clean cihr data
    const cleanCihrJobName = "facultyCV-clean-cihr";
    const cleanCihrJob = new glue.CfnJob(this, cleanCihrJobName, {
        name: cleanCihrJobName,
        role: glueRole.roleArn,
        command: {
        name: "pythonshell",
        pythonVersion: PYTHON_VER,
        scriptLocation:
            "s3://" +
            this.glueS3Bucket.bucketName +
            "/scripts/grants-etl/" +
            "cleanCihr" +
            ".py",
        },
        executionProperty: {
        maxConcurrentRuns: 1,
        },
        maxRetries: MAX_RETRIES,
        maxCapacity: MAX_CAPACITY,
        timeout: TIMEOUT, // 120 min timeout duration
        glueVersion: GLUE_VER,
        defaultArguments: defaultArguments,
    });
  
    // Glue Job: clean nserc data
    const cleanNsercJobName = "facultyCV-clean-nserc";
    const cleanNsercJob = new glue.CfnJob(this, cleanNsercJobName, {
    name: cleanNsercJobName,
    role: glueRole.roleArn,
    command: {
        name: "pythonshell",
        pythonVersion: PYTHON_VER,
        scriptLocation:
        "s3://" +
        this.glueS3Bucket.bucketName +
        "/scripts/grants-etl/" +
        "cleanNserc" +
        ".py",
    },
    executionProperty: {
        maxConcurrentRuns: 1,
    },
    maxRetries: MAX_RETRIES,
    maxCapacity: MAX_CAPACITY,
    timeout: TIMEOUT, // 120 min timeout duration
    glueVersion: GLUE_VER,
    defaultArguments: defaultArguments,
    });

    // Glue Job: clean sshrc data
    const cleanSshrcJobName = "facultyCV-clean-sshrc";
    const cleanSshrcJob = new glue.CfnJob(this, cleanSshrcJobName, {
    name: cleanSshrcJobName,
    role: glueRole.roleArn,
    command: {
        name: "pythonshell",
        pythonVersion: PYTHON_VER,
        scriptLocation:
        "s3://" +
        this.glueS3Bucket.bucketName +
        "/scripts/grants-etl/" +
        "cleanSshrc" +
        ".py",
    },
    executionProperty: {
        maxConcurrentRuns: 1,
    },
    maxRetries: MAX_RETRIES,
    maxCapacity: MAX_CAPACITY,
    timeout: TIMEOUT, // 120 min timeout duration
    glueVersion: GLUE_VER,
    defaultArguments: defaultArguments,
    });

    // Glue Job: clean cfi data
    const cleanCfiJobName = "facultyCV-clean-cfi";
    const cleanCfiJob = new glue.CfnJob(this, cleanCfiJobName, {
    name: cleanCfiJobName,
    role: glueRole.roleArn,
    command: {
        name: "pythonshell",
        pythonVersion: PYTHON_VER,
        scriptLocation:
        "s3://" +
        this.glueS3Bucket.bucketName +
        "/scripts/grants-etl/" +
        "cleanCfi" +
        ".py",
    },
    executionProperty: {
        maxConcurrentRuns: 1,
    },
    maxRetries: MAX_RETRIES,
    maxCapacity: MAX_CAPACITY,
    timeout: TIMEOUT, // 120 min timeout duration
    glueVersion: GLUE_VER,
    defaultArguments: defaultArguments,
    });

    // Glue Job: clean rise data
    const cleanRiseJobName = "facultyCV-clean-rise";
    const cleanRiseJob = new glue.CfnJob(this, cleanRiseJobName, {
    name: cleanRiseJobName,
    role: glueRole.roleArn,
    command: {
        name: "pythonshell",
        pythonVersion: PYTHON_VER,
        scriptLocation:
        "s3://" +
        this.glueS3Bucket.bucketName +
        "/scripts/grants-etl/" +
        "cleanRise" +
        ".py",
    },
    executionProperty: {
        maxConcurrentRuns: 1,
    },
    maxRetries: MAX_RETRIES,
    maxCapacity: MAX_CAPACITY,
    timeout: TIMEOUT, // 120 min timeout duration
    glueVersion: GLUE_VER,
    defaultArguments: defaultArguments,
    });

    // Glue Job: store data into table in database
    const storeDataJobName = "facultyCV-storeData";
    const storeDataJob = new glue.CfnJob(this, storeDataJobName, {
    name: storeDataJobName,
    role: glueRole.roleArn,
    command: {
        name: "pythonshell",
        pythonVersion: PYTHON_VER,
        scriptLocation:
        "s3://" +
        this.glueS3Bucket.bucketName +
        "/scripts/grants-etl/" +
        "storeData" +
        ".py",
    },
    connections: {
        connections: [gluePostgresConnectionName],
    },
    executionProperty: {
        maxConcurrentRuns: MAX_CONCURRENT_RUNS,
    },
    maxRetries: MAX_RETRIES,
    maxCapacity: MAX_CAPACITY,
    timeout: TIMEOUT, // 120 min timeout duration
    glueVersion: GLUE_VER,
    defaultArguments: defaultArguments,
    });

    // Deploy glue job to glue S3 bucket
    new s3deploy.BucketDeployment(this, "DeployGlueJobFiles", {
    sources: [s3deploy.Source.asset("./glue/scripts/grants-etl")],
    destinationBucket: this.glueS3Bucket,
    destinationKeyPrefix: "scripts/grants-etl",
    });

    // Grant S3 read/write role to Glue
    this.glueS3Bucket.grantReadWrite(glueRole);
    grantDataS3Bucket.grantReadWrite(glueRole);

    // Destroy Glue related resources when GrantDataStack is deleted
    cleanCihrJob.applyRemovalPolicy(RemovalPolicy.DESTROY);
    cleanNsercJob.applyRemovalPolicy(RemovalPolicy.DESTROY);
    cleanSshrcJob.applyRemovalPolicy(RemovalPolicy.DESTROY);
    cleanCfiJob.applyRemovalPolicy(RemovalPolicy.DESTROY);
    cleanRiseJob.applyRemovalPolicy(RemovalPolicy.DESTROY);
    storeDataJob.applyRemovalPolicy(RemovalPolicy.DESTROY);
    createFolders.applyRemovalPolicy(RemovalPolicy.DESTROY);
    glueTrigger.applyRemovalPolicy(RemovalPolicy.DESTROY);
    glueRole.applyRemovalPolicy(RemovalPolicy.DESTROY);
  }
}