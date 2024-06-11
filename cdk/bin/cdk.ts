#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AmplifyStack } from '../lib/amplify-stack';
import { ApiStack } from '../lib/api-stack';

const app = new cdk.App();

const apiStack = new ApiStack(app, 'ApiStack', 
  {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }}
)

const amplifyStack = new AmplifyStack(app, 'AmplifyStack', apiStack,
  {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }}
);