import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as iam from "aws-cdk-lib/aws-iam";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Architecture, Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import * as appsync from "aws-cdk-lib/aws-appsync";

export class OidcAuthStack extends cdk.Stack {
  // OIDC-only Cognito User Pool for UBC Identity Broker integration
  // No password/email authentication - all auth handled through UBC
  private readonly userPool: cognito.UserPool;
  private readonly userPoolClient: cognito.UserPoolClient;
  private readonly userPoolDomain: cognito.UserPoolDomain;

  public getUserPool = () => this.userPool;
  public getUserPoolId = () => this.userPool.userPoolId;
  public getUserPoolClient = () => this.userPoolClient;
  public getUserPoolClientId = () => this.userPoolClient.userPoolClientId;
  public getUserPoolDomain = () => this.userPoolDomain;
  public getUserPoolDomainUrl = () => `${this.userPoolDomain.domainName}.auth.${this.region}.amazoncognito.com`;

  // Method to configure AppSync with OIDC authentication
  public getAppSyncAuthConfig(): appsync.AuthorizationConfig {
    return {
      defaultAuthorization: {
        authorizationType: appsync.AuthorizationType.USER_POOL,
        userPoolConfig: {
          userPool: this.userPool,
        },
      },
    };
  }

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    let resourcePrefix = this.node.tryGetContext("prefix");
    if (!resourcePrefix) resourcePrefix = "facultycv"; // Default

    // Create secret in AWS Secrets Manager from environment variable
    const oidcClientSecret = new secretsmanager.Secret(this, 'UBCOidcClientSecret', {
      secretName: `${resourcePrefix}-ubc-oidc-client-secret`,
      description: 'UBC OIDC Client Secret for Faculty CV',
      secretStringValue: cdk.SecretValue.unsafePlainText(
        process.env.UBC_OIDC_CLIENT_SECRET ||
        this.node.tryGetContext('oidcClientSecret') ||
        'placeholder-secret'
      ),
    });

    // Lambda function for post-confirmation trigger
    const addToNewlyRegisteredGroupLambda = new Function(this, "AddToNewlyRegisteredGroupLambda", {
      functionName: `${resourcePrefix}-addToNewlyRegisteredGroup`,
      runtime: Runtime.PYTHON_3_9,
      code: Code.fromAsset("./lambda/addToNewlyRegisteredGroup"),
      handler: "resolver.lambda_handler",
      architecture: Architecture.X86_64,
      timeout: cdk.Duration.minutes(1),
    });

    // Create OIDC-only User Pool (no password/email verification)
    this.userPool = new cognito.UserPool(this, "OidcUserPool", {
      userPoolName: `${resourcePrefix}-oidc-user-pool`,
      // No sign-in aliases needed for OIDC-only authentication
      // Note: Lambda trigger will be added later to avoid circular dependency
      // Disable MFA for OIDC-only (handled by UBC Identity Broker)
      mfa: cognito.Mfa.OFF,
      // Disable account recovery for OIDC-only
      accountRecovery: cognito.AccountRecovery.NONE,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create OIDC Identity Provider
    const oidcProvider = new cognito.UserPoolIdentityProviderOidc(this, "UBCOidcProvider", {
      userPool: this.userPool,
      name: `${resourcePrefix}-${process.env.ENVIRONMENT}`,
      clientId: process.env.OICD_CLIENT_ID || 'facultycv-dev',
      clientSecret: oidcClientSecret.secretValue.unsafeUnwrap(),
      issuerUrl: 'https://broker.id.ubc.ca/auth/realms/idb2',
      scopes: ['openid', 'profile', 'email'],
      attributeMapping: {
        email: cognito.ProviderAttribute.other('email'),
        familyName: cognito.ProviderAttribute.other('family_name'),
        givenName: cognito.ProviderAttribute.other('given_name'),
        custom: {
          'name': cognito.ProviderAttribute.other('cwl_username'),
          'profile': cognito.ProviderAttribute.other('profile'),
          'username': cognito.ProviderAttribute.other('sub'),
        },
      },
    });

    // Create Cognito Domain
    this.userPoolDomain = new cognito.UserPoolDomain(this, "OidcUserPoolDomain", {
      userPool: this.userPool,
      cognitoDomain: {
        domainPrefix: `${resourcePrefix}-${this.account}`.toLowerCase().replace(/[^a-z0-9-]/g, ''),
      },
    });

    // Create User Pool Client with OIDC-only configuration
    this.userPoolClient = new cognito.UserPoolClient(
      this,
      "OidcUserPoolClient",
      {
        userPoolClientName: `${resourcePrefix}-oidc-user-pool-client`,
        userPool: this.userPool,
        // Only support OIDC identity provider (no Cognito native auth)
        supportedIdentityProviders: [
          cognito.UserPoolClientIdentityProvider.custom(oidcProvider.providerName),
        ],
        // Disable SRP auth flows for OIDC-only
        authFlows: {
          userSrp: false,
          userPassword: false,
          adminUserPassword: false,
          custom: false,
        },
        // Token validity settings
        refreshTokenValidity: cdk.Duration.days(5),
        accessTokenValidity: cdk.Duration.hours(1),
        idTokenValidity: cdk.Duration.hours(1),
        oAuth: {
          flows: {
            authorizationCodeGrant: true,
          },
          scopes: [
            cognito.OAuthScope.OPENID,
            cognito.OAuthScope.PROFILE,
            cognito.OAuthScope.EMAIL,
            cognito.OAuthScope.COGNITO_ADMIN,
          ],
          callbackUrls: [
            'http://localhost:3000/auth',
            'https://dev.360.med.ubc.ca/auth',
          ],
          logoutUrls: [
            'http://localhost:3000/keycloak-logout',
            'https://dev.360.med.ubc.ca/keycloak-logout',
          ],
        },
        generateSecret: false,
      }
    );

    // User Groups
    const facultyGroup = new cognito.CfnUserPoolGroup(this, 'FacultyGroup', {
      groupName: 'Faculty',
      userPoolId: this.userPool.userPoolId,
    });

    const assistantGroup = new cognito.CfnUserPoolGroup(this, 'AssistantGroup', {
      groupName: 'Assistant',
      userPoolId: this.userPool.userPoolId,
    });

    const adminGroup = new cognito.CfnUserPoolGroup(this, 'AdminGroup', {
      groupName: 'Admin',
      userPoolId: this.userPool.userPoolId,
    });

    const departmentAdminGroup = new cognito.CfnUserPoolGroup(this, 'DepartmentAdminGroup', {
      groupName: 'DepartmentAdmin',
      userPoolId: this.userPool.userPoolId,
    });

    const newlyRegisteredGroup = new cognito.CfnUserPoolGroup(this, 'NewlyRegisteredGroup', {
      groupName: 'NewlyRegistered',
      userPoolId: this.userPool.userPoolId,
    });

    const facultyAdminGroup = new cognito.CfnUserPoolGroup(this, 'FacultyAdminGroup', {
      groupName: 'FacultyAdmin',
      userPoolId: this.userPool.userPoolId,
    });

    // Grant the Lambda function permission to add users to groups
    addToNewlyRegisteredGroupLambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "cognito-idp:AdminAddUserToGroup",
      ],
      resources: [
        `arn:aws:cognito-idp:${this.region}:${this.account}:userpool/${this.userPool.userPoolId}`,
      ],
    }));

    // Grant Cognito permission to invoke the Lambda function
    addToNewlyRegisteredGroupLambda.addPermission('CognitoInvokePermission', {
      principal: new iam.ServicePrincipal('cognito-idp.amazonaws.com'),
      sourceArn: this.userPool.userPoolArn,
    });

    // Create custom resource Lambda function to attach triggers after deployment
    const triggerAttachmentRole = new iam.Role(this, 'TriggerAttachmentRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        CognitoTriggerPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'cognito-idp:UpdateUserPool',
                'cognito-idp:DescribeUserPool',
              ],
              resources: [this.userPool.userPoolArn],
            }),
          ],
        }),
      },
    });

    const triggerAttachmentFunction = new Function(this, 'TriggerAttachmentFunction', {
      functionName: `${resourcePrefix}-cognito-trigger-attachment`,
      runtime: Runtime.PYTHON_3_9,
      handler: 'index.handler',
      role: triggerAttachmentRole,
      timeout: cdk.Duration.minutes(5),
      code: Code.fromInline(`
import boto3
import json
import logging
import cfnresponse

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    logger.info('Received event: %s' % json.dumps(event))
    
    status = cfnresponse.FAILED
    physical_id = event.get('PhysicalResourceId', 'trigger-attachment')
    
    try:
        request_type = event['RequestType']
        properties = event['ResourceProperties']
        
        user_pool_id = properties['UserPoolId']
        lambda_arn = properties['LambdaArn']
        
        cognito_client = boto3.client('cognito-idp')
        
        if request_type == 'Create' or request_type == 'Update':
            # Get current user pool configuration
            response = cognito_client.describe_user_pool(UserPoolId=user_pool_id)
            user_pool = response['UserPool']
            
            # Update the lambda config
            lambda_config = user_pool.get('LambdaConfig', {})
            lambda_config['PostConfirmation'] = lambda_arn
            
            # Update the user pool with the new lambda trigger
            cognito_client.update_user_pool(
                UserPoolId=user_pool_id,
                LambdaConfig=lambda_config
            )
            
            logger.info(f'Successfully attached post-confirmation trigger to user pool {user_pool_id}')
            status = cfnresponse.SUCCESS
            
        elif request_type == 'Delete':
            # Remove the lambda trigger on deletion
            try:
                response = cognito_client.describe_user_pool(UserPoolId=user_pool_id)
                user_pool = response['UserPool']
                
                lambda_config = user_pool.get('LambdaConfig', {})
                if 'PostConfirmation' in lambda_config:
                    del lambda_config['PostConfirmation']
                    
                    cognito_client.update_user_pool(
                        UserPoolId=user_pool_id,
                        LambdaConfig=lambda_config if lambda_config else {}
                    )
                    
                logger.info(f'Successfully removed post-confirmation trigger from user pool {user_pool_id}')
            except Exception as e:
                logger.warning(f'Failed to remove trigger (this may be expected if resources are being deleted): {e}')
            
            status = cfnresponse.SUCCESS
            
    except Exception as e:
        logger.error(f'Error: {e}')
        status = cfnresponse.FAILED
    
    finally:
        cfnresponse.send(event, context, status, {}, physical_id)
`),
    });

    // Custom resource to attach the Lambda trigger after both User Pool and Lambda exist
    const triggerAttachment = new cdk.CustomResource(this, 'TriggerAttachment', {
      serviceToken: triggerAttachmentFunction.functionArn,
      properties: {
        UserPoolId: this.userPool.userPoolId,
        LambdaArn: addToNewlyRegisteredGroupLambda.functionArn,
      },
    });

    // Ensure the custom resource runs after both the User Pool and Lambda function are created
    triggerAttachment.node.addDependency(this.userPool);
    triggerAttachment.node.addDependency(addToNewlyRegisteredGroupLambda);

    // Output important values
    new cdk.CfnOutput(this, "OidcUserPoolId", {
      value: this.userPool.userPoolId,
      description: "OIDC User Pool ID",
    });

    new cdk.CfnOutput(this, "OidcUserPoolClientId", {
      value: this.userPoolClient.userPoolClientId,
      description: "OIDC User Pool Client ID",
    });

    new cdk.CfnOutput(this, "OidcCognitoDomain", {
      value: `${this.userPoolDomain.domainName}.auth.${this.region}.amazoncognito.com`,
      description: "OIDC Cognito Domain URL",
    });

    new cdk.CfnOutput(this, "TokenSigningKeyUrl", {
      value: `https://cognito-idp.${this.region}.amazonaws.com/${this.userPool.userPoolId}/.well-known/jwks.json`,
      description: "Token signing key URL",
    });
  }
}
