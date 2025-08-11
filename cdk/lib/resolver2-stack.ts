import * as appsync from "aws-cdk-lib/aws-appsync";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Architecture, Code, Function, LayerVersion, Runtime } from "aws-cdk-lib/aws-lambda";
import { Role } from "aws-cdk-lib/aws-iam";
import * as iam from "aws-cdk-lib/aws-iam";
import { DatabaseStack } from "./database-stack";
import { CVGenStack } from "./cvgen-stack";
import { ApiStack } from "./api-stack";
import { UserImportStack } from "./userimport-stack";

export class Resolver2Stack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    apiStack: ApiStack,
    databaseStack: DatabaseStack,
    cvGenStack: CVGenStack,
    userImportStack: UserImportStack,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    let resourcePrefix = this.node.tryGetContext("prefix");
    if (!resourcePrefix) resourcePrefix = "facultycv"; // Default

    const psycopgLayer = apiStack.getLayers()["psycopg2"];
    const databaseConnectLayer = apiStack.getLayers()["databaseConnect"];
    const openaiLayer = apiStack.getLayers()["openai"];
    const reportLabLayer = apiStack.getLayers()["reportlab"];
    const requestsLayer = apiStack.getLayers()["requests"];
    const awsJwtVerifyLayer = apiStack.getLayers()["aws-jwt-verify"];
    const resolverRole = apiStack.getResolverRole();

    // Note: S3 permissions for user import bucket will be handled separately

    // GraphQL Resolvers
    const assignResolver = (
      api: appsync.GraphqlApi,
      fieldName: string,
      ds: appsync.LambdaDataSource,
      typeName: string,
      resolverCode?: string,
      runtime?: appsync.FunctionRuntime
    ) => {
      new appsync.Resolver(this, "FacultyCVResolver-" + fieldName, {
        api: api,
        dataSource: ds,
        typeName: typeName,
        fieldName: fieldName,
        code: resolverCode ? appsync.Code.fromInline(resolverCode) : undefined,
        runtime: runtime,
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
      runtime: Runtime = Runtime.PYTHON_3_9,
      resolverCode?: string,
      jsRuntime?: appsync.FunctionRuntime
    ) => {
      const resolver = new Function(this, `facultycv-${directory}-resolver`, {
        functionName: `${resourcePrefix}-${directory}-resolver`,
        runtime: runtime,
        memorySize: 512,
        code: Code.fromAsset(`./lambda/${directory}`),
        handler: "resolver.lambda_handler",
        architecture: Architecture.X86_64,
        timeout: cdk.Duration.minutes(3),
        environment: env,
        role: role,
        layers: layers,
        vpc: databaseStack.dbCluster.vpc, // Same VPC as the database
      });

      const lambdaDataSource = new appsync.LambdaDataSource(this, `${directory}-data-source`, {
        api: api,
        lambdaFunction: resolver,
        name: `${directory}-data-source`,
      });

      fieldNames.forEach((field) => assignResolver(api, field, lambdaDataSource, typeName, resolverCode, jsRuntime));
    };

    createResolver(
      apiStack.getApi(),
      "getUserCVData",
      ["getUserCVData"],
      "Query",
      {
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpointReader,
      },
      resolverRole,
      [psycopgLayer, databaseConnectLayer]
    );

    createResolver(
      apiStack.getApi(),
      "getAllSectionCVData",
      ["getAllSectionCVData"],
      "Query",
      {
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpointReader,
      },
      resolverRole,
      [psycopgLayer, databaseConnectLayer]
    );

    createResolver(
      apiStack.getApi(),
      "getArchivedUserCVData",
      ["getArchivedUserCVData"],
      "Query",
      {
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpointReader,
      },
      resolverRole,
      [psycopgLayer, databaseConnectLayer]
    );

    createResolver(
      apiStack.getApi(),
      "updateUserCVData",
      ["updateUserCVData"],
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
      "getElsevierAuthorMatches",
      ["getElsevierAuthorMatches"],
      "Query",
      {},
      resolverRole,
      [requestsLayer]
    );

    createResolver(apiStack.getApi(), "getOrcidSections", ["getOrcidSections"], "Query", {}, resolverRole, [
      requestsLayer,
    ]);

    createResolver(
      apiStack.getApi(),
      "getTotalOrcidPublications",
      ["getTotalOrcidPublications"],
      "Query",
      {},
      resolverRole,
      [requestsLayer]
    );

    createResolver(
      apiStack.getApi(),
      "getTotalScopusPublications",
      ["getTotalScopusPublications"],
      "Query",
      {},
      resolverRole,
      [requestsLayer]
    );

    createResolver(apiStack.getApi(), "getOrcidPublication", ["getOrcidPublication"], "Query", {}, resolverRole, [
      requestsLayer,
    ]);

    createResolver(apiStack.getApi(), "GetNotifications", ["GetNotifications"], "Query", {}, resolverRole, [
      requestsLayer,
    ]);

    createResolver(
      apiStack.getApi(),
      "getBioResponseData",
      ["getBioResponseData"],
      "Query",
      {},
      resolverRole,
      [openaiLayer],
      Runtime.PYTHON_3_9,
      // Resolver Code
      `
      import { util } from '@aws-appsync/utils';

      export function request(ctx) {
          return {
              operation: 'Invoke',
              payload: {
                  fieldName: ctx.info.fieldName,
                  parentTypeName: ctx.info.parentTypeName,
                  user_input: ctx.args.username_input,
                  variables: ctx.info.variables,
                  selectionSetList: ctx.info.selectionSetList,
                  selectionSetGraphQL: ctx.info.selectionSetGraphQL,
              },
          };
      }

      export function response(ctx) {
          const { result, error } = ctx;
          if (error) {
              util.error(error.message, error.type, result);
          }
          return result;
      }
      `,
      appsync.FunctionRuntime.JS_1_0_0
    );

    createResolver(
      apiStack.getApi(),
      "getUserDeclarations",
      ["getUserDeclarations"],
      "Query",
      {
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpointReader,
      },
      resolverRole,
      [psycopgLayer, databaseConnectLayer]
    );

    createResolver(
      apiStack.getApi(),
      "addUserDeclaration",
      ["addUserDeclaration"],
      "Mutation",
      {
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpoint,
      },
      resolverRole,
      [psycopgLayer, databaseConnectLayer]
    );

    createResolver(
      apiStack.getApi(),
      "GetAIResponse",
      ["GetAIResponse"],
      "Query",
      {},
      resolverRole,
      [openaiLayer],
      Runtime.PYTHON_3_9,
      // Resolver Code
      `
      import { util } from '@aws-appsync/utils';

      export function request(ctx) {
          return {
              operation: 'Invoke',
              payload: {
                  fieldName: ctx.info.fieldName,
                  parentTypeName: ctx.info.parentTypeName,
                  user_input: ctx.args.user_input,
                  variables: ctx.info.variables,
                  selectionSetList: ctx.info.selectionSetList,
                  selectionSetGraphQL: ctx.info.selectionSetGraphQL,
              },
          };
      }

      export function response(ctx) {
          const { result, error } = ctx;
          if (error) {
              util.error(error.message, error.type, result);
          }
          return result;
      }
      `,
      appsync.FunctionRuntime.JS_1_0_0
    );

    createResolver(
      apiStack.getApi(),
      "getAllUniversityInfo",
      ["getAllUniversityInfo"],
      "Query",
      {
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpointReader,
      },
      resolverRole,
      [psycopgLayer, databaseConnectLayer]
    );

    createResolver(
      apiStack.getApi(),
      "getPresignedUrl",
      ["getPresignedUrl"],
      "Query",
      {
        BUCKET_NAME: cvGenStack.cvS3Bucket.bucketName,
        USER_IMPORT_BUCKET_NAME: userImportStack.getUserImportBucketName(),
        USER_POOL_ISS: `https://cognito-idp.${this.region}.amazonaws.com/${apiStack.getUserPoolId()}`,
        CLIENT_ID: apiStack.getUserPoolClientId(),
      },
      resolverRole,
      [awsJwtVerifyLayer],
      Runtime.NODEJS_20_X
    );

    createResolver(
      apiStack.getApi(),
      "cvIsUpToDate",
      ["cvIsUpToDate"],
      "Query",
      {
        TABLE_NAME: cvGenStack.dynamoDBTable.tableName,
        BUCKET_NAME: cvGenStack.cvS3Bucket.bucketName,
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpointReader,
      },
      resolverRole,
      [psycopgLayer, databaseConnectLayer]
    );

    createResolver(
      apiStack.getApi(),
      "getNumberOfGeneratedCVs",
      ["getNumberOfGeneratedCVs"],
      "Query",
      {
        BUCKET_NAME: cvGenStack.cvS3Bucket.bucketName,
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpointReader,
      },
      resolverRole,
      [psycopgLayer, databaseConnectLayer]
    );

    createResolver(
      apiStack.getApi(),
      "getLatexConfiguration",
      ["getLatexConfiguration"],
      "Query",
      {
        BUCKET_NAME: cvGenStack.cvS3Bucket.bucketName,
      },
      resolverRole,
      []
    );

    createResolver(
      apiStack.getApi(),
      "updateLatexConfiguration",
      ["updateLatexConfiguration"],
      "Mutation",
      {
        BUCKET_NAME: cvGenStack.cvS3Bucket.bucketName,
      },
      resolverRole,
      []
    );

    createResolver(
      apiStack.getApi(),
      "addUniversityInfo",
      ["addUniversityInfo"],
      "Mutation",
      {
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpoint,
      },
      resolverRole,
      [psycopgLayer, databaseConnectLayer]
    );

    createResolver(
      apiStack.getApi(),
      "updateUniversityInfo",
      ["updateUniversityInfo"],
      "Mutation",
      {
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpoint,
      },
      resolverRole,
      [psycopgLayer, databaseConnectLayer]
    );

    createResolver(
      apiStack.getApi(),
      "linkScopusId",
      ["linkScopusId"],
      "Mutation",
      {
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpoint,
      },
      resolverRole,
      [psycopgLayer, databaseConnectLayer]
    );

    createResolver(apiStack.getApi(), "getOrcidAuthorMatches", ["getOrcidAuthorMatches"], "Query", {}, resolverRole, [
      requestsLayer,
    ]);

    createResolver(
      apiStack.getApi(),
      "linkOrcid",
      ["linkOrcid"],
      "Mutation",
      {
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpoint,
      },
      resolverRole,
      [psycopgLayer, databaseConnectLayer]
    );

    createResolver(
      apiStack.getApi(),
      "getAuditView",
      ["getAuditView"],
      "Query",
      {
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpoint,
      },
      resolverRole,
      [psycopgLayer, databaseConnectLayer]
    );

    createResolver(
      apiStack.getApi(),
      "addAuditView",
      ["addAuditView"],
      "Mutation",
      {
        DB_PROXY_ENDPOINT: databaseStack.rdsProxyEndpoint,
      },
      resolverRole,
      [psycopgLayer, databaseConnectLayer]
    );
  }
}
