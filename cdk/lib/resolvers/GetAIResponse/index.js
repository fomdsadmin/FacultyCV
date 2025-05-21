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
    // Use util.error if you want to throw error (import util from '@aws-appsync/utils')
    return {
      errorMessage: error.message,
      errorType: error.type,
      result,
    };
  }
  return result;
}
