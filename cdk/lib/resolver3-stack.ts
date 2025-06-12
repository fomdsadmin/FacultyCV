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

export class Resolver3Stack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    apiStack: ApiStack,
    databaseStack: DatabaseStack,
    cvGenStack: CVGenStack,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    let resourcePrefix = this.node.tryGetContext("prefix");
    if (!resourcePrefix) resourcePrefix = "facultycv"; // Default

    const psycopgLayer = apiStack.getLayers()["psycopg2"];
    const databaseConnectLayer = apiStack.getLayers()["databaseConnect"];
    const reportLabLayer = apiStack.getLayers()["reportlab"];
    const requestsLayer = apiStack.getLayers()["requests"];
    const awsJwtVerifyLayer = apiStack.getLayers()["aws-jwt-verify"];
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
        functionName: `${resourcePrefix}-${directory}-resolver`,
        runtime: runtime,
        memorySize: 512,
        code: Code.fromAsset(`./lambda/${directory}`),
        handler: "resolver.lambda_handler",
        architecture: Architecture.X86_64,
        timeout: cdk.Duration.minutes(1),
        environment: env,
        role: role,
        layers: layers,
        vpc: databaseStack.dbCluster.vpc, // Same VPC as the database
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
      "getUserConnections",
      ["getUserConnections"],
      "Query",
      {
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpointReader,
      },
      resolverRole,
      [psycopgLayer, databaseConnectLayer]
    );

    createResolver(
      apiStack.getApi(),
      "addUserConnection",
      ["addUserConnection"],
      "Mutation",
      {
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpoint,
      },
      resolverRole,
      [psycopgLayer, databaseConnectLayer]
    );

    createResolver(
      apiStack.getApi(),
      "updateUserConnection",
      ["updateUserConnection"],
      "Mutation",
      {
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpoint,
      },
      resolverRole,
      [psycopgLayer, databaseConnectLayer]
    );

    createResolver(
      apiStack.getApi(),
      "deleteUserConnection",
      ["deleteUserConnection"],
      "Mutation",
      {
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpoint,
      },
      resolverRole,
      [psycopgLayer, databaseConnectLayer]
    );

    createResolver(
      apiStack.getApi(),
      "deleteUserCVSectionData",
      ["deleteUserCVSectionData"],
      "Mutation",
      {
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpoint,
      },
      resolverRole,
      [psycopgLayer, databaseConnectLayer]
    );
    createResolver(
      apiStack.getApi(),
      "updateUserDeclaration",
      ["updateUserDeclaration"],
      "Mutation",
      {
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpoint,
      },
      resolverRole,
      [psycopgLayer, databaseConnectLayer]
    );

    createResolver(
      apiStack.getApi(),
      "deleteUserDeclaration",
      ["deleteUserDeclaration"],
      "Mutation",
      {
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpoint,
      },
      resolverRole,
      [psycopgLayer, databaseConnectLayer]
    );

    createResolver(
      apiStack.getApi(),
      "getAllTemplates",
      ["getAllTemplates"],
      "Query",
      {
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpointReader,
      },
      resolverRole,
      [psycopgLayer, databaseConnectLayer]
    );

    createResolver(
      apiStack.getApi(),
      "addTemplate",
      ["addTemplate"],
      "Mutation",
      {
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpoint,
      },
      resolverRole,
      [psycopgLayer, databaseConnectLayer]
    );

    createResolver(
      apiStack.getApi(),
      "updateTemplate",
      ["updateTemplate"],
      "Mutation",
      {
        TABLE_NAME: cvGenStack.dynamoDBTable.tableName,
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpoint,
      },
      resolverRole,
      [psycopgLayer, databaseConnectLayer]
    );

    createResolver(
      apiStack.getApi(),
      "deleteTemplate",
      ["deleteTemplate"],
      "Mutation",
      {
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpoint,
      },
      resolverRole,
      [psycopgLayer, databaseConnectLayer]
    );

    createResolver(
      apiStack.getApi(),
      "getTeachingDataMatches",
      ["getTeachingDataMatches"],
      "Query",
      {
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpointReader,
      },
      resolverRole,
      [psycopgLayer, databaseConnectLayer]
    );

    createResolver(
      apiStack.getApi(),
      "getPublicationMatches",
      ["getPublicationMatches"],
      "Query",
      {},
      resolverRole,
      [requestsLayer]
    );

    createResolver(
      apiStack.getApi(),
      "getSecureFundingMatches",
      ["getSecureFundingMatches"],
      "Query",
      {
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpointReader,
      },
      resolverRole,
      [psycopgLayer, databaseConnectLayer]
    );

    createResolver(
      apiStack.getApi(),
      "getRiseDataMatches",
      ["getRiseDataMatches"],
      "Query",
      {
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpointReader,
      },
      resolverRole,
      [psycopgLayer, databaseConnectLayer]
    );

    createResolver(
      apiStack.getApi(),
      "getPatentMatches",
      ["getPatentMatches"],
      "Query",
      {
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpointReader,
      },
      resolverRole,
      [psycopgLayer, databaseConnectLayer]
    );
  }
}
