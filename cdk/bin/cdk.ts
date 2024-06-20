#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AmplifyStack } from '../lib/amplify-stack';
import { ApiStack } from '../lib/api-stack';
import { VpcStack } from '../lib/vpc-stack';
import { DatabaseStack } from '../lib/database-stack';
import { DbFetchStack } from '../lib/dbfetch-stack';

const app = new cdk.App();

// const apiStack = new ApiStack(app, 'ApiStack', 
//   {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }}
// )

// const amplifyStack = new AmplifyStack(app, 'AmplifyStack', apiStack,
//   {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }}
// );

const vpcStack = new VpcStack(app, "VpcStack", 
  {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }}
);

const databaseStack = new DatabaseStack(app, 'DatabaseStack', vpcStack, 
  {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }}
);

const dbFetchStack = new DbFetchStack(app, 'DbFetchStack', databaseStack, 
  {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }});