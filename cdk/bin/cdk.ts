#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DatabaseStack } from '../lib/database-stack';
import { GrantDataStack } from '../lib/grantdata-stack';
import { VpcStack } from '../lib/vpc-stack';
import { DbFetchStack } from '../lib/dbfetch-stack'

const app = new cdk.App();

const vpcStack = new VpcStack(app, "VpcStack", 
    {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }});

const databaseStack = new DatabaseStack(app, 'DatabaseStack', vpcStack, 
    {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }});

const grantDataStack = new GrantDataStack(app, 'GrantDataStack', vpcStack, databaseStack,
    {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }});
grantDataStack.addDependency(vpcStack)
grantDataStack.addDependency(databaseStack)

const dbfetchStack = new DbFetchStack(app, 'DbFetchStack', databaseStack, grantDataStack,
    {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }});
dbfetchStack.addDependency(databaseStack)