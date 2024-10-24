import { Stack, StackProps, CfnParameter } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Fn } from 'aws-cdk-lib';
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";


export class VpcStack extends Stack {
    public vpc: ec2.Vpc;

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        function getVPCParameter() {
            const client = new SSMClient({ region: "ca-central-1" });
            const input = { Name: "existing-VPC-id" };
            const command = new GetParameterCommand(input);
            
            return client.send(command)
            .then(response => response.Parameter?.Value)
            .catch(error => {
                console.error(`Error fetching parameter: ${error}`);
                throw error; 
            });
        }
 
        getVPCParameter().then(existingVpcId => {
            console.log("Existing VPC ID:", existingVpcId);
                
            if (existingVpcId != 'None') {

                // Look up existing VPC
                this.vpc = ec2.Vpc.fromLookup(this, 'LookedUpVpc', {
                    vpcId: existingVpcId,
                }) as ec2.Vpc;

                // Create a public subnet
                const publicSubnet = new ec2.Subnet(this, 'PublicSubnet', {
                    vpcId: this.vpc.vpcId,
                    availabilityZone: this.vpc.availabilityZones[0],
                    cidrBlock: "172.31.96.0/20",
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
                    routeTableId: this.vpc.privateSubnets[0].routeTable.routeTableId,
                    destinationCidrBlock: '0.0.0.0/0',
                    natGatewayId: natGateway.ref,
                });

                new ec2.CfnRoute(this, `PrivateSubnetRoute2`, {
                    routeTableId: this.vpc.privateSubnets[1].routeTable.routeTableId,
                    destinationCidrBlock: '0.0.0.0/0',
                    natGatewayId: natGateway.ref,
                });

                new ec2.CfnRoute(this, `PrivateSubnetRoute3`, {
                    routeTableId: this.vpc.privateSubnets[2].routeTable.routeTableId,
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
        })
        .catch(error => {
            console.error("Error in main:", error);
        });
    }
}
