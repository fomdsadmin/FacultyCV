import * as appsync from "aws-cdk-lib/aws-appsync";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  Architecture,
  Code,
  Function,
  LayerVersion,
  Runtime,
} from "aws-cdk-lib/aws-lambda";
import { Role } from "aws-cdk-lib/aws-iam";
import { DatabaseStack } from "./database-stack";
import { CVGenStack } from "./cvgen-stack";
import { ApiStack } from "./api-stack";

export class ResolverStack extends cdk.Stack {
  constructor(scope: Construct, id: string, apiStack: ApiStack, databaseStack: DatabaseStack, cvGenStack: CVGenStack, props?: cdk.StackProps) {
    super(scope, id, props);

    const psycopgLayer = apiStack.getLayers()['psycopg2'];
    const databaseConnectLayer = apiStack.getLayers()['databaseConnect']
    const reportLabLayer = apiStack.getLayers()['reportlab']
    const requestsLayer = apiStack.getLayers()['requests']
    const awsJwtVerifyLayer = apiStack.getLayers()['aws-jwt-verify']
    const resolverRole = apiStack.getResolverRole();

    // GraphQL Resolvers
    const assignResolver = (
      api: appsync.GraphqlApi,
      fieldName: string,
      ds: appsync.LambdaDataSource,
      typeName: string
    ) => {
      new appsync.Resolver(this, "FacultyCVResolver-" + fieldName, {
        api: api,
        dataSource: ds,
        typeName: typeName,
        fieldName: fieldName,
      });
      return;
    };

    const createResolver = (
      api: appsync.GraphqlApi,
      directory: string,
      fieldNames: string[],
      typeName: string,
      env: { [key: string]: string },
      role: Role,
      layers: LayerVersion[],
      runtime: Runtime = Runtime.PYTHON_3_9
    ) => {
      const resolver = new Function(this, `facultycv-${directory}-resolver`, {
        functionName: `facultycv-${directory}-resolver`,
        runtime: runtime,
        memorySize: 512,
        code: Code.fromAsset(`./lambda/${directory}`),
        handler: "resolver.lambda_handler",
        architecture: Architecture.X86_64,
        timeout: cdk.Duration.minutes(1),
        environment: env,
        role: role,
        layers: layers,
        vpc: databaseStack.dbCluster.vpc // Same VPC as the database
      });

      const lambdaDataSource = new appsync.LambdaDataSource(
        this,
        `${directory}-data-source`,
        {
          api: api,
          lambdaFunction: resolver,
          name: `${directory}-data-source`,
        }
      );

      fieldNames.forEach((field) =>
        assignResolver(api, field, lambdaDataSource, typeName)
      );
    };

    createResolver(
      apiStack.getApi(),
      "addToUserGroup",
      ["addToUserGroup"],
      "Mutation",
      {USER_POOL_ID: apiStack.getUserPoolId()},
      resolverRole,
      []
    );
    
    createResolver(
      apiStack.getApi(),
      "removeFromUserGroup",
      ["removeFromUserGroup"],
      "Mutation",
      {USER_POOL_ID: apiStack.getUserPoolId()},
      resolverRole,
      []
    );
    
    createResolver(
      apiStack.getApi(),
      "getUser",
      ["getUser"],
      "Query",
      {
        USER_POOL_ID: apiStack.getUserPoolId(),
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpoint
      },
      resolverRole,
      [psycopgLayer, databaseConnectLayer]
    );
    
    createResolver(
      apiStack.getApi(),
      "getAllUsers",
      ["getAllUsers"],
      "Query",
      {
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpoint
      },
      resolverRole,
      [psycopgLayer, databaseConnectLayer]
    );
    
    createResolver(
      apiStack.getApi(),
      "getExistingUser",
      ["getExistingUser"],
      "Query",
      {
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpoint
      },
      resolverRole,
      [psycopgLayer, databaseConnectLayer]
    );
    
    createResolver(
      apiStack.getApi(),
      "pdfGenerator",
      ["generatePDF"],
      "Mutation",
      {},
      resolverRole,
      [reportLabLayer]
    );
    
    createResolver(
      apiStack.getApi(),
      "addUser",
      ["addUser"],
      "Mutation",
      {
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpoint
      },
      resolverRole,
      [psycopgLayer, databaseConnectLayer]
    );
    
    createResolver(
      apiStack.getApi(),
      "updateUser",
      ["updateUser"],
      "Mutation",
      {
        'TABLE_NAME': cvGenStack.dynamoDBTable.tableName,
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpoint
      },
      resolverRole,
      [psycopgLayer, databaseConnectLayer]
    );
    
    createResolver(
      apiStack.getApi(),
      "getAllSections",
      ["getAllSections"],
      "Query",
      {
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpoint
      },
      resolverRole,
      [psycopgLayer, databaseConnectLayer]
    );
    
    createResolver(
      apiStack.getApi(),
      "getArchivedSections",
      ["getArchivedSections"],
      "Query",
      {
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpoint
      },
      resolverRole,
      [psycopgLayer, databaseConnectLayer]
    );
    
    createResolver(
      apiStack.getApi(),
      "addSection",
      ["addSection"],
      "Mutation",
      {
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpoint
      },
      resolverRole,
      [psycopgLayer, databaseConnectLayer]
    );
    
    createResolver(
      apiStack.getApi(),
      "updateSection",
      ["updateSection"],
      "Mutation",
      {
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpoint
      },
      resolverRole,
      [psycopgLayer, databaseConnectLayer]
    );
    
    createResolver(
      apiStack.getApi(),
      "addUserCVData",
      ["addUserCVData"],
      "Mutation",
      {
        'TABLE_NAME': cvGenStack.dynamoDBTable.tableName,
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpoint
      },
      resolverRole,
      [psycopgLayer, databaseConnectLayer]
    );
    
  }
}
