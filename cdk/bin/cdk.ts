#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AmplifyStack } from '../lib/amplify-stack';
import { ApiStack } from '../lib/api-stack';
import { VpcStack } from '../lib/vpc-stack';
import { DatabaseStack } from '../lib/database-stack';
import { DbFetchStack } from '../lib/dbfetch-stack';
import { DataFetchStack } from '../lib/datafetch-stack';
import { CVGenStack } from '../lib/cvgen-stack';
import { GrantDataStack } from '../lib/grantdata-stack';
import { PatentDataStack } from '../lib/patentdata-stack';

const app = new cdk.App();

const vpcStack = new VpcStack(app, "VpcStack", 
  {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }}
);

const databaseStack = new DatabaseStack(app, 'DatabaseStack', vpcStack, 
  {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }}
);

const apiStack = new ApiStack(app, 'ApiStack', databaseStack,
   {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }}
)

const amplifyStack = new AmplifyStack(app, 'AmplifyStack', apiStack,
  {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }}
);

const dbFetchStack = new DbFetchStack(app, 'DbFetchStack', databaseStack, apiStack,
  {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }}
);

const dataFetchStack = new DataFetchStack(app, 'DataFetchStack', databaseStack, apiStack,
  {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }}
);

const cvGenStack = new CVGenStack(app, 'CVGenStack', { env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }});

const grantDataStack = new GrantDataStack(app, 'GrantDataStack', vpcStack, databaseStack,
  {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }}
);

const patentDataStack = new PatentDataStack(app, 'PatentDataStack', grantDataStack, databaseStack,
  {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }}
);
