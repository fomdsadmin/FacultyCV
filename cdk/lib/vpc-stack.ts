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

        const existingVpcId: string = 'vpc-0515a0d6ee4abcd8e'; //MANUALLY CHANGE

        //const existingVpcId = cdk.aws_ssm.StringParameter.valueForStringParameter(this, 'existing-VPC-id');

        // Check if existing VPC ID is provided
        if (existingVpcId !== '') {
            
            // Use existing VPC
            const getExistingVpc = ec2.Vpc.fromLookup(this, 'ImportVPC', {
                vpcId: existingVpcId
            }) as ec2.Vpc;
            this.vpc = getExistingVpc;

            // Create a public subnet
            const publicSubnet = new ec2.Subnet(this, 'PublicSubnet', {
                vpcId: this.vpc.vpcId,
                availabilityZone: this.vpc.availabilityZones[0],
                cidrBlock: '172.31.96.0/20', //MANUALLY CHANGE
                mapPublicIpOnLaunch: true,
            });

            // Create an Internet Gateway and attach it to the VPC
            const internetGateway = new ec2.CfnInternetGateway(this, 'InternetGateway', {});
            new ec2.CfnVPCGatewayAttachment(this, 'VPCGatewayAttachment', {
                vpcId: this.vpc.vpcId,
                internetGatewayId: internetGateway.ref,
            });

            // Create a route table for the public subnet
            const publicRouteTable = new ec2.CfnRouteTable(this, 'PublicRouteTable', {
                vpcId: this.vpc.vpcId,
            });

            // Associate the public subnet with the new route table
            new ec2.CfnSubnetRouteTableAssociation(this, 'PublicSubnetAssociation', {
                subnetId: publicSubnet.subnetId,
                routeTableId: publicRouteTable.ref,
            });

            // Add a NAT Gateway in the public subnet
            const natGateway = new ec2.CfnNatGateway(this, 'NatGateway', {
                subnetId: publicSubnet.subnetId,
                allocationId: new ec2.CfnEIP(this, 'EIP', {}).attrAllocationId,
            });

            // Create a route to the Internet Gateway
            new ec2.CfnRoute(this, 'PublicRoute', {
                routeTableId: publicRouteTable.ref,
                destinationCidrBlock: '0.0.0.0/0',
                gatewayId: internetGateway.ref,
            });

            // Update route table for private subnets
            new ec2.CfnRoute(this, `PrivateSubnetRoute1`, {
                routeTableId: 'rtb-07d69755b7dd2310a', //MANUALLY CHANGE
                destinationCidrBlock: '0.0.0.0/0',
                natGatewayId: natGateway.ref,
            });

            new ec2.CfnRoute(this, `PrivateSubnetRoute2`, {
                routeTableId: 'rtb-05c671af07ddb1e3d', //MANUALLY CHANGE
                destinationCidrBlock: '0.0.0.0/0',
                natGatewayId: natGateway.ref,
            });

            new ec2.CfnRoute(this, `PrivateSubnetRoute3`, {
                routeTableId: 'rtb-015a7fae3d76f0d83', //MANUALLY CHANGE
                destinationCidrBlock: '0.0.0.0/0',
                natGatewayId: natGateway.ref,
            });

            // Add interface endpoints for private isolated subnets
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
