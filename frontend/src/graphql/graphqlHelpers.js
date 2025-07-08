import { generateClient } from "aws-amplify/api";
import { getUserQuery } from "./queries";
import { addUserMutation } from "./mutations";

export const runGraphql = async (query, variables = {}, token) => {
  const client = generateClient();

  const result = await client.graphql({
    query,
    variables,
    authMode: "openidConnect",
    headers: {
      Authorization: `Bearer ${token}`
    }
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
  orcid_id,
  token
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
    null,
    token
  );

  return results?.data?.addUser;
};
