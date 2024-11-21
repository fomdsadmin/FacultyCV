import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { BlockPublicAccess, Bucket, BucketEncryption, EventType, HttpMethods } from 'aws-cdk-lib/aws-s3';
import { Construct } from "constructs";
import { DockerImageCode, DockerImageFunction } from 'aws-cdk-lib/aws-lambda';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';

export class CVGenStack extends Stack {
    public readonly cvS3Bucket: Bucket;
    public readonly dynamoDBTable: Table;
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const resourcePrefix = this.node.tryGetContext('prefix');

        // S3 Bucket for storing CVs
        this.cvS3Bucket = new Bucket(this, 'cvS3Bucket', {
            publicReadAccess: false,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
            encryption: BucketEncryption.S3_MANAGED,
            eventBridgeEnabled: true,
            cors: [{
                allowedMethods: [
                    HttpMethods.GET,
                    HttpMethods.PUT
                ],
                allowedOrigins: ["*"],
                allowedHeaders: ["*"]
            }],
            bucketName: `${resourcePrefix}-${this.account}-cv-bucket`
        });

        // DynamoDB to store a log of transactions across data sections
        this.dynamoDBTable = new Table(this, 'cvLogTable', {
            partitionKey: { name: 'logEntryId', type: AttributeType.STRING },
            tableName: `${resourcePrefix}-${this.account}-CVLogTable`
        });

        const cvGenLambda = new DockerImageFunction(this, 'cvGenFunction', {
            code: DockerImageCode.fromImageAsset('./cvGenerator/'),
            memorySize: 2048, // Extra memory needed for faster performance
            timeout: Duration.minutes(15),
            environment: {
                "LUAOTFLOAD_TEXMFVAR": "/tmp/luatex-cache",
                "TEXMFCONFIG": "/tmp/texmf-config",
                "TEXMFVAR": "/tmp/texmf-var"
            },
            functionName: `${resourcePrefix}-cvGenLambdaFunction`
        });

        cvGenLambda.addToRolePolicy(new PolicyStatement({
            actions: [
                "s3:ListBucket",
                "s3:*Object"
            ],
            resources: [this.cvS3Bucket.bucketArn + "/*"]
        }));

        this.cvS3Bucket.addEventNotification(
            EventType.OBJECT_CREATED_PUT,
            new LambdaDestination(cvGenLambda),
            {
                suffix: '.tex'
            }
        );
    } 
}