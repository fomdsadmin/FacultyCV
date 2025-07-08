import { generateClient } from "aws-amplify/api";
import { getUserQuery } from "./queries";
import { addUserMutation } from "./mutations";
import { fetchAuthSession } from "aws-amplify/auth";

export const runGraphql = async (query, variables = {}, token) => {
  // const session = await fetchAuthSession();
  // const token = session.tokens?.idToken?.toString();
  // console.log("session", session);

  const client = generateClient({
    headers: async () => {
      return {
        Authorization: token,
      };
    },
  });


  if (!client) {
    throw new Error("GraphQL client is not configured properly.");
  }
  else {
    console.log("GraphQL client configured successfully.");
    console.log(client);
  }

  const result = await client.graphql({
    query,
    variables
  });

  return result;
};

export const getUser = async (email, token) => {
  const results = await runGraphql(getUserQuery, { email }, token);
  return results?.data?.getUser;
};

export const addUser = async (
  first_name,
  last_name,
  preferred_name,
  email,
  role,
  bio,
  rank,
  institution,
  primary_department,
  secondary_department,
  primary_faculty,
  secondary_faculty,
  primary_affiliation,
  secondary_affiliation,
  campus,
  keywords,
  institution_user_id,
  scopus_id,
  orcid_id
) => {
  const results = await runGraphql(
    addUserMutation(
      first_name,
      last_name,
      preferred_name,
      email,
      role,
      bio,
      rank,
      institution,
      primary_department,
      secondary_department,
      primary_faculty,
      secondary_faculty,
      primary_affiliation,
      secondary_affiliation,
      campus,
      keywords,
      institution_user_id,
      scopus_id,
      orcid_id
    ),
    null
  );

  return results?.data?.addUser;
};
