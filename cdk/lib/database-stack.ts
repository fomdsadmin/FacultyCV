import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import { aws_rds as rds } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { VpcStack } from './vpc-stack';
import * as sm from 'aws-cdk-lib/aws-secretsmanager'

export class DatabaseStack extends Stack {
    public readonly dbInstance: rds.DatabaseInstance;
    public readonly secretPath: string;
    public readonly rdsProxyEndpoint: string;

    constructor(scope: Construct, id: string, vpcStack: VpcStack, props?: StackProps) {
      super(scope, id, props);

      this.secretPath = 'facultyCV/credentials/dbCredentials';

      // Database secret with customized username retrieve at deployment time
      const dbUsername = sm.Secret.fromSecretNameV2(this, 'facultyCV-dbUsername', 'facultyCV-dbUsername')

      const parameterGroup = new rds.ParameterGroup(this, "rdsParameterGroup", {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_16_3,
        }),
        description: "Empty parameter group", // Might need to change this later
        parameters: {
          'rds.force_ssl': '0'
        }
      });

      // Create IAM role for RDS enhanced monitoring
      const monitoringRole = new iam.Role(this, 'RDSMonitoringRole', {
          assumedBy: new iam.ServicePrincipal('monitoring.rds.amazonaws.com'),
          managedPolicies: [
              iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonRDSEnhancedMonitoringRole')
          ]
      });

      // Define the postgres database
      this.dbInstance = new rds.DatabaseInstance(this, 'facultyCV', {
        vpc: vpcStack.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_16_3,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.BURSTABLE3,
          ec2.InstanceSize.MEDIUM,
        ),
        credentials: rds.Credentials.fromUsername(dbUsername.secretValueFromJson("username").unsafeUnwrap() , {
          secretName: this.secretPath
        }),
        multiAz: true,
        allocatedStorage: 100,
        maxAllocatedStorage: 115,
        allowMajorVersionUpgrade: false,
        autoMinorVersionUpgrade: true,
        backupRetention: cdk.Duration.days(7),
        deleteAutomatedBackups: true,
        deletionProtection: true,
        databaseName: 'facultyCV',
        publiclyAccessible: false,
        storageEncrypted: true, // storage encryption at rest
        parameterGroup: parameterGroup,
        monitoringInterval: cdk.Duration.minutes(1), // Set monitoring interval
        monitoringRole: monitoringRole // Set monitoring role
      });

      this.dbInstance.connections.securityGroups.forEach(function (securityGroup) {
        securityGroup.addIngressRule(ec2.Peer.ipv4('10.0.0.0/16'), ec2.Port.tcp(5432), 'Postgres Ingress');
      });

      // RDS Proxy
      const rdsProxyRole = new iam.Role(this, 'RDSProxyRole', {
        assumedBy: new iam.ServicePrincipal('rds.amazonaws.com'),
      });

      rdsProxyRole.addToPolicy(
        new iam.PolicyStatement({
          resources: ['*'],
          actions: ['rds-db:connect']
        })
      );

      const rdsProxy = this.dbInstance.addProxy(id+'-proxy', {
        secrets: [this.dbInstance.secret!],
        vpc: vpcStack.vpc,
        role: rdsProxyRole,
        securityGroups: this.dbInstance.connections.securityGroups,
        requireTLS: false,
    });

    this.dbInstance.grantConnect(rdsProxyRole);
    this.rdsProxyEndpoint = rdsProxy.endpoint;
  }
}