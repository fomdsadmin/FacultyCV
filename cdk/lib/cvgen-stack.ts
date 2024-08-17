import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { BlockPublicAccess, Bucket, BucketEncryption, EventType } from 'aws-cdk-lib/aws-s3';
import { Construct } from "constructs";
import { DockerImageCode, DockerImageFunction } from 'aws-cdk-lib/aws-lambda';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

export class CVGenStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // S3 Bucket for storing CVs
        const cvS3Bucket = new Bucket(this, 'cvS3Bucket', {
            publicReadAccess: false,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
            encryption: BucketEncryption.S3_MANAGED,
            eventBridgeEnabled: true
        });

        const cvGenLambda = new DockerImageFunction(this, 'cvGenFunction', {
            code: DockerImageCode.fromImageAsset('./'),
            memorySize: 512,
            timeout: Duration.minutes(15)
        });

        cvGenLambda.addToRolePolicy(new PolicyStatement({
            actions: [
                "s3:ListBucket",
                "s3:*Object"
            ],
            resources: [cvS3Bucket.bucketArn + "/*"]
        }));

        cvS3Bucket.addEventNotification(
            EventType.OBJECT_CREATED_PUT,
            new LambdaDestination(cvGenLambda),
            {
                suffix: '.tex'
            }
        );
    } 
}