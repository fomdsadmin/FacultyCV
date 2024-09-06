import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { BlockPublicAccess, Bucket, BucketEncryption, EventType, HttpMethods } from 'aws-cdk-lib/aws-s3';
import { Construct } from "constructs";
import { DockerImageCode, DockerImageFunction } from 'aws-cdk-lib/aws-lambda';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

export class CVGenStack extends Stack {
    public readonly cvS3Bucket: Bucket;
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

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
            }]
        });

        const cvGenLambda = new DockerImageFunction(this, 'cvGenFunction', {
            code: DockerImageCode.fromImageAsset('./'),
            memorySize: 2048, // Extra memory needed for faster performance
            timeout: Duration.minutes(15),
            environment: {
                "LUAOTFLOAD_TEXMFVAR": "/tmp/luatex-cache",
                "TEXMFCONFIG": "/tmp/texmf-config",
                "TEXMFVAR": "/tmp/texmf-var"
            }
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