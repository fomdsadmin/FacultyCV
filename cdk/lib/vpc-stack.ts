import { Stack, StackProps, CfnParameter } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class VpcStack extends Stack {
    public readonly vpc: ec2.Vpc;

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // // Parameters for existing resources
        // const existingVpcId = new CfnParameter(this, 'existingVpcId', {
        //     type: 'String',
        //     description: 'The ID of the existing VPC',
        //     default: '',
        // });

        const existingVpcId: string = 'vpc-0515a0d6ee4abcd8e';

        //const existingVpcId = cdk.aws_ssm.StringParameter.valueForStringParameter(this, 'existing-VPC-id');

        // Check if existing VPC ID is provided
        if (existingVpcId !== '') {
            // Use existing VPC
            const getExistingVpc = ec2.Vpc.fromLookup(this, 'ImportVPC', {
                vpcId: existingVpcId
            }) as ec2.Vpc;
            this.vpc = getExistingVpc;

            // Add endpoints to VPC
            this.vpc.addInterfaceEndpoint('SSM Endpoint', {
                service: ec2.InterfaceVpcEndpointAwsService.SSM,
                subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
            });

            this.vpc.addInterfaceEndpoint('Secrets Manager Endpoint', {
                service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
                subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
            });

            this.vpc.addInterfaceEndpoint('RDS Endpoint', {
                service: ec2.InterfaceVpcEndpointAwsService.RDS,
                subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
            });

            this.vpc.addInterfaceEndpoint('Glue Endpoint', {
                service: ec2.InterfaceVpcEndpointAwsService.GLUE,
                subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
            });

            // // Add gateway endpoint for S3
            // this.vpc.addGatewayEndpoint('S3 Endpoint', {
            //     service: ec2.GatewayVpcEndpointAwsService.S3,
            //     subnets: [{ subnetType: ec2.SubnetType.PRIVATE_ISOLATED }],
            // });
        } else {
            // Create new VPC
            const natGatewayProvider = ec2.NatProvider.gateway();

            this.vpc = new ec2.Vpc(this, 'facultyCV-Vpc', {
                ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
                natGatewayProvider: natGatewayProvider,
                natGateways: 1,
                maxAzs: 2,
                subnetConfiguration: [
                    {
                        name: 'public-subnet-1',
                        subnetType: ec2.SubnetType.PUBLIC,
                    },
                    {
                        name: 'isolated-subnet-1',
                        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
                    },
                ],
                gatewayEndpoints: {
                    S3: {
                        service: ec2.GatewayVpcEndpointAwsService.S3,
                    },
                },
            });

            // Add endpoints to VPC
            this.vpc.addInterfaceEndpoint('SSM Endpoint', {
                service: ec2.InterfaceVpcEndpointAwsService.SSM,
                subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
            });

            this.vpc.addInterfaceEndpoint('Secrets Manager Endpoint', {
                service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
                subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
            });

            this.vpc.addInterfaceEndpoint('RDS Endpoint', {
                service: ec2.InterfaceVpcEndpointAwsService.RDS,
                subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
            });

            this.vpc.addInterfaceEndpoint('Glue Endpoint', {
                service: ec2.InterfaceVpcEndpointAwsService.GLUE,
                subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
            });

            this.vpc.isolatedSubnets.forEach(({ routeTable: { routeTableId } }, index) => {
                new ec2.CfnRoute(this, 'PrivateSubnetPeeringConnectionRoute' + index, {
                    destinationCidrBlock: '0.0.0.0/0',
                    routeTableId,
                    natGatewayId: natGatewayProvider.configuredGateways[0].gatewayId,
                });
            });
        }
    }
}
