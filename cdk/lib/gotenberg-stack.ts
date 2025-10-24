import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { ApiStack } from './api-stack';

export class GotenbergStack extends cdk.Stack {
    constructor(
        scope: Construct,
        id: string,
        apiStack: ApiStack,
        props?: cdk.StackProps
    ) {
        super(scope, id, props);

        let resourcePrefix = this.node.tryGetContext("prefix");
        if (!resourcePrefix) resourcePrefix = "facultycv"; // Default

        // Import existing VPC by name and auto-discover public subnets
        const vpc = ec2.Vpc.fromLookup(this, 'ExistingVpc', {
            vpcName: 'facultycv-VPC'
        });

        // Auto-discover public subnets in the VPC
        const publicSubnets = vpc.selectSubnets({
            subnetType: ec2.SubnetType.PUBLIC
        });

        // S3 Bucket for Gotenberg documents
        const gotenbergBucket = new s3.Bucket(this, 'GotenbergDocumentsBucket', {
            bucketName: `${resourcePrefix}-gotenberg-documents`,
            cors: [
                {
                    allowedHeaders: ['*'],
                    allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.HEAD, s3.HttpMethods.POST],
                    allowedOrigins: ['http://localhost:3000', process.env.ENVIRONMENT === 'dev' ? 'https://dev.360.med.ubc.ca' : 'https://360.med.ubc.ca/'],
                    exposedHeaders: ['ETag']
                }
            ],
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        // ECS Cluster
        const cluster = new ecs.Cluster(this, 'GotenbergCluster', {
            clusterName: 'gotenberg-pdf-gen-cluster',
            vpc: vpc,
        });

        // Application Load Balancer
        const alb = new elbv2.ApplicationLoadBalancer(this, 'GotenbergLoadBalancer', {
            loadBalancerName: 'gotenberg-load-balancer',
            vpc: vpc,
            internetFacing: true,
            vpcSubnets: publicSubnets
        });

        // Target Group
        const targetGroup = new elbv2.ApplicationTargetGroup(this, 'GotenbergTargetGroup', {
            targetGroupName: 'gotenberg-pdf-gen-target-group',
            port: 3000,
            protocol: elbv2.ApplicationProtocol.HTTP,
            vpc: vpc,
            targetType: elbv2.TargetType.IP,
            healthCheck: {
                path: '/health',
                healthyHttpCodes: '200',
            }
        });

        // ALB Listener
        alb.addListener('GotenbergListener', {
            port: 80,
            defaultTargetGroups: [targetGroup]
        });

        // Task Definition
        const taskDefinition = new ecs.FargateTaskDefinition(this, 'GotenbergTaskDefinition', {
            family: 'gotenberg-pdf-gen-task',
            memoryLimitMiB: 2048,
            cpu: 1024,
        });

        // Container Definition
        taskDefinition.addContainer('GotenbergContainer', {
            image: ecs.ContainerImage.fromRegistry('gotenberg/gotenberg:8'),
            portMappings: [
                {
                    containerPort: 3000,
                    protocol: ecs.Protocol.TCP,
                }
            ],
            logging: ecs.LogDrivers.awsLogs({
                streamPrefix: 'gotenberg',
            }),
        });

        // ECS Service
        new ecs.FargateService(this, 'GotenbergService', {
            cluster: cluster,
            taskDefinition: taskDefinition,
            desiredCount: 2,
            assignPublicIp: true,
            vpcSubnets: publicSubnets,
            serviceName: 'gotenberg-pdf-gen-service',
        }).attachToApplicationTargetGroup(targetGroup);

        // IAM Role for Lambda functions
        const lambdaRole = new iam.Role(this, 'GotenbergLambdaRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
            ],
            inlinePolicies: {
                S3Access: new iam.PolicyDocument({
                    statements: [
                        new iam.PolicyStatement({
                            effect: iam.Effect.ALLOW,
                            actions: [
                                's3:GetObject',
                                's3:PutObject',
                                's3:DeleteObject',
                                's3:GetObjectVersion',
                                's3:GetObjectTagging',
                                's3:PutObjectTagging',
                                's3:DeleteObjectTagging',
                                's3:ListBucket',
                                's3:PutBucketCors',
                                's3:GetBucketCors',
                            ],
                            resources: [
                                gotenbergBucket.bucketArn,
                                `${gotenbergBucket.bucketArn}/*`,
                            ],
                        }),
                        new iam.PolicyStatement({
                            effect: iam.Effect.ALLOW,
                            actions: [
                                'appsync:GraphQL',
                            ],
                            resources: [
                                `${apiStack.getApi().arn}/*`,
                            ],
                        }),
                    ],
                }),
            },
        });

        // Separate IAM role for the notify Lambda (needs AppSync invoke permissions)
        const notifyLambdaRole = new iam.Role(this, 'NotifyGotenbergLambdaRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
            ],
        });

        // Grant AppSync permission to invoke the notify Lambda
        notifyLambdaRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
            ],
            resources: ['arn:aws:logs:*:*:*'],
        }));

        // getPresignedGotenbergBucketUrl Lambda
        const getPresignedUrlLambda = new lambda.Function(this, 'GetPresignedGotenbergBucketUrl', {
            functionName: `${resourcePrefix}-getPresignedGotenbergBucketUrl`,
            runtime: lambda.Runtime.PYTHON_3_9,
            handler: 'resolver.lambda_handler',
            code: lambda.Code.fromAsset('./lambda/getPresignedGotenbergBucketUrl'),
            role: lambdaRole,
            environment: {
                BUCKET_NAME: gotenbergBucket.bucketName,
            },
            timeout: cdk.Duration.minutes(3),
        });

        // Import the API key from the exported value
        const apiKey = cdk.Fn.importValue(`${resourcePrefix}-ApiKey`);

        // generateGotenbergPdf Lambda
        const generatePdfLambda = new lambda.Function(this, 'GenerateGotenbergPdf', {
            functionName: `${resourcePrefix}-generateGotenbergPdf`,
            runtime: lambda.Runtime.PYTHON_3_9,
            handler: 'resolver.lambda_handler',
            code: lambda.Code.fromAsset('./lambda/generateGotenbergPdf'),
            role: lambdaRole,
            environment: {
                BUCKET_NAME: gotenbergBucket.bucketName,
                GOTENBERG_HOST: alb.loadBalancerDnsName,
                APPSYNC_ENDPOINT: apiStack.getApi().graphqlUrl,
                APPSYNC_API_KEY: apiKey,
            },
            timeout: cdk.Duration.minutes(15),
        });

        // pdf2docx Lambda (Docker)
        const pdf2docxLambda = new lambda.DockerImageFunction(this, 'Pdf2DocxLambda', {
            functionName: `${resourcePrefix}-pdf2docx`,
            code: lambda.DockerImageCode.fromImageAsset('./pdf2docx', {
                platform: cdk.aws_ecr_assets.Platform.LINUX_AMD64,
                buildArgs: {
                    '--platform': 'linux/amd64'
                }
            }),
            role: lambdaRole,
            memorySize: 2048,
            ephemeralStorageSize: cdk.Size.mebibytes(1024),
            environment: {
                BUCKET_NAME: gotenbergBucket.bucketName,
                APPSYNC_ENDPOINT: apiStack.getApi().graphqlUrl,
                APPSYNC_API_KEY: apiKey,
            },
            timeout: cdk.Duration.minutes(15),
        });

        // S3 Triggers
        gotenbergBucket.addEventNotification(
            s3.EventType.OBJECT_CREATED,
            new s3n.LambdaDestination(generatePdfLambda),
            { suffix: '.html' }
        );

        gotenbergBucket.addEventNotification(
            s3.EventType.OBJECT_CREATED,
            new s3n.LambdaDestination(pdf2docxLambda),
            { suffix: '.pdf' }
        );

        // GraphQL Resolver for getPresignedGotenbergBucketUrl
        const presignedUrlDataSource = new appsync.LambdaDataSource(this, 'GetGotenbergPresignedUrlDataSource', {
            api: apiStack.getApi(),
            lambdaFunction: getPresignedUrlLambda,
            name: 'getGotenbergPresignedUrlDataSource',
        });

        new appsync.Resolver(this, 'GetGotenbergPresignedUrlResolver', {
            api: apiStack.getApi(),
            dataSource: presignedUrlDataSource,
            typeName: 'Query',
            fieldName: 'getPresignedGotenbergBucketUrl',
            code: appsync.Code.fromInline(`
        import { util } from '@aws-appsync/utils';

        /**
         * Sends a request to a Lambda function. Passes all information about the request from the info object.
         * @param {import('@aws-appsync/utils').Context} ctx the context
         * @returns {import('@aws-appsync/utils').LambdaRequest} the request
         */
        export function request(ctx) {
            return {
                operation: 'Invoke',
                payload: {
                    fieldName: ctx.info.fieldName,
                    parentTypeName: ctx.info.parentTypeName,
                    variables: ctx.info.variables,
                    selectionSetList: ctx.info.selectionSetList,
                    selectionSetGraphQL: ctx.info.selectionSetGraphQL,
                },
            };
        }

        /**
         * Process a Lambda function response
         * @param {import('@aws-appsync/utils').Context} ctx the context
         * @returns {*} the Lambda function response
         */
        export function response(ctx) {
            const { result, error } = ctx;
            if (error) {
                util.error(error.message, error.type, result);
            }
            return result;
        }
      `),
            runtime: appsync.FunctionRuntime.JS_1_0_0,
        });

        // Simple Lambda resolver for notifyGotenbergGenerationComplete
        const notifyLambda = new lambda.Function(this, 'NotifyGotenbergGenerationComplete', {
            functionName: `${resourcePrefix}-notifyGotenbergGenerationComplete`,
            runtime: lambda.Runtime.PYTHON_3_9,
            handler: 'index.handler',
            role: notifyLambdaRole, // Use the separate role
            code: lambda.Code.fromInline(`
def handler(event, context):
    print(f"Notify mutation called with event: {event}")
    key = event.get('arguments', {}).get('key', '')
    print(f"Returning key: {key}")
    return {"key": key}
            `),
            timeout: cdk.Duration.seconds(30),
        });

        const notifyDataSource = new appsync.LambdaDataSource(this, 'NotifyGotenbergLambdaDataSource', {
            api: apiStack.getApi(),
            lambdaFunction: notifyLambda,
            name: 'notifyGotenbergLambdaDataSource',
        });

        new appsync.Resolver(this, 'NotifyGotenbergGenerationCompleteResolver', {
            api: apiStack.getApi(),
            dataSource: notifyDataSource,
            typeName: 'Mutation',
            fieldName: 'notifyGotenbergGenerationComplete',
            code: appsync.Code.fromInline(`
        export function request(ctx) {
            return {
                operation: 'Invoke',
                payload: {
                    arguments: ctx.arguments,
                },
            };
        }

        export function response(ctx) {
            return ctx.result;
        }
      `),
            runtime: appsync.FunctionRuntime.JS_1_0_0,
        });

        // Outputs
        new cdk.CfnOutput(this, 'GotenbergBucketName', {
            value: gotenbergBucket.bucketName,
            description: 'Gotenberg Documents S3 Bucket Name',
        });

        new cdk.CfnOutput(this, 'GotenbergLoadBalancerDns', {
            value: alb.loadBalancerDnsName,
            description: 'Gotenberg Load Balancer DNS Name',
        });
    }
}