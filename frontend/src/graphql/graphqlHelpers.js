import { generateClient, put } from "aws-amplify/api";
import { addUserMutation } from "./mutations";
import { getAllUsersQuery, getUserQuery } from "./queries";
import { Amplify } from "aws-amplify";

export const runGraphql = async (query) => {
  const client = generateClient();
  const results = await client.graphql({
    query: query,
  });
  return results;
};

const executeGraphql = async (query, variables = null) => {
  const client = generateClient();
  let input = {
    query,
  };

  if (variables) {
    input = {
      query,
      variables,
    };
  }

  const results = await client.graphql(input);
  console.log(results)
  return results;
};

export const getUser = async (email="knaveentest2@ubc.ca") => {
  const results = await executeGraphql(getUserQuery, { email: email });
  console.log(results);
  return results["data"]["getUser"];
};

export const getAllUsers = async () => {
  const results = await executeGraphql(getAllUsersQuery);
  console.log(results);
  return results["data"]["getAllUsers"];
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
