#!/usr/bin/env node
import 'source-map-support/register';
import 'dotenv/config';
import * as cdk from 'aws-cdk-lib';
import { AmplifyStack } from '../lib/amplify-stack';
import { ApiStack } from '../lib/api-stack';
import { VpcStack } from '../lib/vpc-stack';
import { Tags } from 'aws-cdk-lib';
import { DatabaseStack } from '../lib/database-stack';
import { DbFetchStack } from '../lib/dbfetch-stack';
import { DataFetchStack } from '../lib/datafetch-stack';
import { CVGenStack } from '../lib/cvgen-stack';
import { GrantDataStack } from '../lib/grantdata-stack';
import { UserImportStack } from '../lib/userimport-stack';
import { PatentDataStack } from '../lib/patentdata-stack';
import { ResolverStack } from '../lib/resolver-stack';
import { Resolver2Stack } from '../lib/resolver2-stack';
import { Resolver3Stack } from '../lib/resolver3-stack';
import { SupportFormStack } from '../lib/supportform-stack';
import { BatchApiGatewayStack } from '../lib/batch-apigateway-stack';
import { OidcAuthStack } from '../lib/oidc-auth-stack';

const app = new cdk.App();

let resourcePrefix = app.node.tryGetContext('prefix');
    if (!resourcePrefix)
      resourcePrefix = 'facultycv' // Default

const vpcStack = new VpcStack(app, `${resourcePrefix}-VpcStack`, 
  {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }}
);

const databaseStack = new DatabaseStack(app, `${resourcePrefix}-DatabaseStack`, vpcStack, 
  {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }}
);

const cvGenStack = new CVGenStack(app,  `${resourcePrefix}-CVGenStack`, { env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }});

// Create the new OIDC Auth Stack
const oidcAuthStack = new OidcAuthStack(app, `${resourcePrefix}-OidcAuthStack`, {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
});

const apiStack = new ApiStack(app, `${resourcePrefix}-ApiStack`, databaseStack, cvGenStack, oidcAuthStack,
   {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }}
)

const userImportStack = new UserImportStack(app, `${resourcePrefix}-UserImportStack`, vpcStack, databaseStack, {
  userPoolId: oidcAuthStack.getUserPoolId(),
  psycopgLayer: apiStack.getLayers()['psycopg2'],
  databaseConnectLayer: apiStack.getLayers()['databaseConnect'],
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
});

const resolverStack = new ResolverStack(app, `${resourcePrefix}-ResolverStack`, apiStack, databaseStack, cvGenStack,
  {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }}
)

const grantDataStack = new GrantDataStack(app, `${resourcePrefix}-GrantDataStack`, vpcStack, databaseStack,
  {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }}
);

const resolver2Stack = new Resolver2Stack(app, `${resourcePrefix}-Resolver2Stack`, apiStack, databaseStack, cvGenStack, userImportStack,
  {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }}
)

const resolver3Stack = new Resolver3Stack(app, `${resourcePrefix}-Resolver3Stack`, apiStack, databaseStack, cvGenStack,
  {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }}
)

const batchApiGatewayStack = new BatchApiGatewayStack(app, `${resourcePrefix}-BatchApiGatewayStack`, apiStack, databaseStack, cvGenStack, oidcAuthStack, {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
});

const supportFormStack = new SupportFormStack(app, `${resourcePrefix}-SupportFormStack`, apiStack, {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
});

const amplifyStack = new AmplifyStack(app, `${resourcePrefix}-AmplifyStack`, apiStack, oidcAuthStack, batchApiGatewayStack, supportFormStack,
  {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }}
);

const dbFetchStack = new DbFetchStack(app, `${resourcePrefix}-DbFetchStack`, databaseStack, apiStack,
  {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }}
);

const dataFetchStack = new DataFetchStack(app, `${resourcePrefix}-DataFetchStack`, databaseStack, apiStack,
  {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }}
);

const patentDataStack = new PatentDataStack(app, `${resourcePrefix}-PatentDataStack`, grantDataStack, databaseStack,
  {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }}
);

Tags.of(app).add("app", "Faculty-CV");