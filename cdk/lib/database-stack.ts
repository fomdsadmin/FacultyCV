import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import { aws_rds as rds } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { VpcStack } from './vpc-stack';
import * as sm from 'aws-cdk-lib/aws-secretsmanager'
import { DatabaseCluster, DatabaseInstanceProps } from 'aws-cdk-lib/aws-rds';

export class DatabaseStack extends Stack {
    public readonly dbCluster: DatabaseCluster; 
    public readonly secretPath: string;
    public readonly rdsProxyEndpointReader: string;
    public readonly rdsProxyEndpoint: string;

    constructor(scope: Construct, id: string, vpcStack: VpcStack, props?: StackProps) {
      super(scope, id, props);

      let resourcePrefix = this.node.tryGetContext('prefix');
      if (!resourcePrefix)
        resourcePrefix = 'facultycv' // Default
      this.secretPath = 'facultyCV/credentials/databaseCredentialsCluster';

      // Database secret with customized username retrieve at deployment time
      const dbUsername = sm.Secret.fromSecretNameV2(this, 'facultyCV-dbUsername', 'facultyCV-dbUsername')

      // Create IAM role for RDS enhanced monitoring
      const monitoringRole = new iam.Role(this, 'RDSMonitoringRole', {
          assumedBy: new iam.ServicePrincipal('monitoring.rds.amazonaws.com'),
          managedPolicies: [
              iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonRDSEnhancedMonitoringRole')
          ],
          roleName: `${resourcePrefix}-RDSMonitoringRole`
      });

      const credentialsCluster = rds.Credentials.fromUsername(dbUsername.secretValueFromJson("username").unsafeUnwrap() , {
        secretName: this.secretPath
      });

      // Aurora Postgres Cluster
      this.dbCluster = new rds.DatabaseCluster(this, 'facultyCVDBCluster', {
        engine: rds.DatabaseClusterEngine.auroraPostgres({ version: rds.AuroraPostgresEngineVersion.VER_16_2 }),
        credentials: credentialsCluster,
        vpc: vpcStack.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        writer: rds.ClusterInstance.provisioned('writer', {
          instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MEDIUM)
        }),
        readers: [rds.ClusterInstance.provisioned('reader', {
          instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MEDIUM)
        })],
        storageEncrypted: true,
        parameters: {
          'rds.force_ssl': '0'
        },
        monitoringInterval: cdk.Duration.minutes(1), // Set monitoring interval
        monitoringRole: monitoringRole, // Set monitoring role
        clusterIdentifier: `${resourcePrefix}-Cluster`
      });

      const vpcCidrBlock = vpcStack.vpc.vpcCidrBlock;

      this.dbCluster.connections.securityGroups.forEach(function (securityGroup) {
        securityGroup.addIngressRule(ec2.Peer.ipv4(vpcCidrBlock), ec2.Port.tcp(5432), 'Postgres Ingress');
      });

      // RDS Proxy
      const rdsProxyRole = new iam.Role(this, 'RDSProxyRole', {
        assumedBy: new iam.ServicePrincipal('rds.amazonaws.com'),
        roleName: `${resourcePrefix}-RDSProxyRole`
      });

      rdsProxyRole.addToPolicy(
        new iam.PolicyStatement({
          resources: ['*'],
          actions: ['rds-db:connect']
        })
      );

      const rdsProxyAurora = this.dbCluster.addProxy(id+'-proxy', {
        secrets: [this.dbCluster.secret!],
        vpc: vpcStack.vpc,
        role: rdsProxyRole,
        securityGroups: this.dbCluster.connections.securityGroups,
        requireTLS: false,
        dbProxyName: `${resourcePrefix}-${id}-proxy`
      });

      const rdsProxyAuroroRead = new cdk.CfnResource(this, 'rdsProxyReadEndpoint', {
        type: 'AWS::RDS::DBProxyEndpoint',
        properties: {
          'DBProxyEndpointName': rdsProxyAurora.dbProxyName + '-read',
          'DBProxyName': rdsProxyAurora.dbProxyName,
          'TargetRole': 'READ_ONLY',
          'VpcSecurityGroupIds': this.dbCluster.connections.securityGroups.map(item => item.securityGroupId),
          'VpcSubnetIds': vpcStack.vpc.selectSubnets({
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED
          }).subnetIds
        }
      });

    this.rdsProxyEndpoint = rdsProxyAurora.endpoint;
    this.rdsProxyEndpointReader = rdsProxyAuroroRead.getAtt('Endpoint').toString();
  }
}
