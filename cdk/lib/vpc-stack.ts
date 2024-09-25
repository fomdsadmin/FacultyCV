import { Stack, StackProps, CfnParameter } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as iam from 'aws-cdk-lib/aws-iam'
import { ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import { NatProvider } from 'aws-cdk-lib/aws-ec2';

export class VpcStack extends Stack {
    public readonly vpc: ec2.Vpc;

    constructor(scope: Construct, id: string, props?: StackProps) {
      super(scope, id, props);

      // Parameters for existing resources
      const existingVpcId = new CfnParameter(this, 'existingVpcId', {
          type: 'String',
          description: 'The ID of the existing VPC',
          default: '',
      });

      const existingNatGatewayId = new CfnParameter(this, 'existingNatGatewayId', {
          type: 'String',
          description: 'The ID of the existing NAT Gateway',
          default: '',
      });

      const existingPublicSubnetId = new CfnParameter(this, 'existingPublicSubnetId', {
          type: 'String',
          description: 'The ID of the existing Public Subnet',
          default: '',
      });

      const existingIsolatedSubnetId = new CfnParameter(this, 'existingIsolatedSubnetId', {
          type: 'String',
          description: 'The ID of the existing Isolated Subnet',
          default: '',
      });

      // Check if existing VPC ID is provided
      if (existingVpcId.valueAsString !== '' && existingNatGatewayId.valueAsString !== '' && existingPublicSubnetId.valueAsString !== '' && existingIsolatedSubnetId.valueAsString !== '') {
          // Use existing VPC
          // You can either use vpcId OR vpcName and fetch the desired vpc
          const getExistingVpc = ec2.Vpc.fromLookup(this, 'ImportVPC',{
            vpcId: existingVpcId.valueAsString
            //vpcName: "VPC_NAME"
          }) as ec2.Vpc;
          this.vpc = getExistingVpc;
          // this.vpc = ec2.Vpc.fromVpcAttributes(this, 'ExistingVpc', {
          //     vpcId: existingVpcId.valueAsString,
          //     availabilityZones: ['us-west-2a', 'us-west-2b'], // Adjust as needed
          //     publicSubnetIds: [existingPublicSubnetId.valueAsString],
          //     isolatedSubnetIds: [existingIsolatedSubnetId.valueAsString],
          // });
          // Use existing subnets and NAT Gateway
          const publicSubnet = ec2.Subnet.fromSubnetId(this, 'PublicSubnet', existingPublicSubnetId.valueAsString);
          const isolatedSubnet = ec2.Subnet.fromSubnetId(this, 'IsolatedSubnet', existingIsolatedSubnetId.valueAsString);

          // Add routes to the existing subnets
          new ec2.CfnRoute(this, 'PublicSubnetRoute', {
              destinationCidrBlock: '0.0.0.0/0',
              routeTableId: publicSubnet.routeTable.routeTableId,
              natGatewayId: existingNatGatewayId.valueAsString,
          });

          new ec2.CfnRoute(this, 'IsolatedSubnetRoute', {
              destinationCidrBlock: '0.0.0.0/0',
              routeTableId: isolatedSubnet.routeTable.routeTableId,
              natGatewayId: existingNatGatewayId.valueAsString,
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

          this.vpc.addFlowLog('facultyCV-vpcFlowLog');

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