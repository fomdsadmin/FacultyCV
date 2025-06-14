import { generateClient, put } from "aws-amplify/api";
import {
  getAllSectionsQuery,
  getArchivedSectionsQuery,
  getUserCVDataQuery,
  getUserQuery,
  getAllUsersQuery,
  getAllUniversityInfoQuery,
  getAllNotificationsQuery,
  getUserDeclarationsQuery,
  getElsevierAuthorMatchesQuery,
  getExistingUserQuery,
  getUserConnectionsQuery,
  getArchivedUserCVDataQuery,
  getOrcidAuthorMatchesQuery,
  getAllTemplatesQuery,
  getTeachingDataMatchesQuery,
  getPublicationMatchesQuery,
  getSecureFundingMatchesQuery,
  getRiseDataMatchesQuery,
  getPatentMatchesQuery,
  getPresignedUrlQuery,
  getUserInstitutionIdQuery,
  getNumberOfGeneratedCVsQuery,
  cvIsUpToDateQuery,
  getOrcidSectionsQuery,
  getTotalOrcidPublicationsQuery,
  getOrcidPublicationQuery,
  getLatexConfigurationQuery,
  GET_BIO_RESPONSE_DATA,
} from "./queries";
import {
  updateSectionMutation,
  addUserMutation,
  addUniversityInfoMutation,
  updateUserCVDataMutation,
  updateUserMutation,
  updateUniversityInfoMutation,
  linkScopusIdMutation,
  addUserConnectionMutation,
  updateUserConnectionMutation,
  deleteUserConnectionMutation,
  updateUserCVDataArchiveMutation,
  linkOrcidMutation,
  addTemplateMutation,
  updateTemplateMutation,
  deleteTemplateMutation,
  addToUserGroupMutation,
  removeFromUserGroupMutation,
  updateLatexConfigurationMutation,
  ADD_USER_DECLARATION,
  ADD_BATCHED_USER_CV_DATA,
  DELETE_USER_DECLARATION,
  UPDATE_USER_DECLARATION,
  ADD_SECTION,
  ADD_USER_CV_DATA,
} from "./mutations";
import { getUserId } from "../getAuthToken";

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
  return results;
};
const runGraphql = async (query) => {
  const client = generateClient();
  const results = await client.graphql({
    query: query,
  });
  return results;
};

// --- GET ---

/**
 * Function to get all users
 * Return value:
 * [
 *  {
 *      user_id
 *     first_name
 *    last_name
 *   preferred_name
 *  email
 * role
 * bio
 * rank
 * primary_department
 * secondary_department
 * primary_faculty
 * secondary_faculty
 * campus
 * keywords
 * institution_user_id
 * scopus_id
 * orcid_id
 * joined_timestamp
 *  }, ...
 * ]
 */
export const getAllUsers = async () => {
  const results = await runGraphql(getAllUsersQuery());
  return results["data"]["getAllUsers"];
};

/**
 * Function to get all sections that are part of the schema
 * Return value:
 * [
 *  {
 *      attributes: JSON object with placeholder value - used to determine the structure (and not the actual data) of the section
 *      dataSectionId: Identifier for the section in the DB
 *      data_type: Umbrella term for the section
 *      description
 *      title
 *  }, ...
 * ]
 */
export const getAllSections = async () => {
  const results = await runGraphql(getAllSectionsQuery());
  return results["data"]["getAllSections"];
};

/**
 * Function to get all archived sections that are part of the schema
 * Return value:
 * [
 *  {
 *      attributes: JSON object with placeholder value - used to determine the structure (and not the actual data) of the section
 *      dataSectionId: Identifier for the section in the DB
 *      data_type: Umbrella term for the section
 *      description
 *      title
 *  }, ...
 * ]
 */
export const getArchivedSections = async () => {
  const results = await runGraphql(getArchivedSectionsQuery());
  return results["data"]["getArchivedSections"];
};
/**
 * Function to get user data
 * Arguments:
 * email
 * Return value:
 * {
 *      user_id
 *      first_name
 *      last_name
 *      preferred_name
 *      email
 *      role
 *      bio
 *      rank
 *      primary_department
 *      secondary_department
 *      primary_faculty
 *      secondary_faculty
 *      campus
 *      keywords
 *      scopus_id
 *      orcid_id
 *   }
 */
export const getUser = async (email) => {
  const results = await executeGraphql(getUserQuery, { email: email });
  console.log(results);
  return results["data"]["getUser"];
};

/**
 * Function to get user data with institution_user_id
 * Arguments:
 * email
 * Return value:
 * {
 *      user_id
 *      first_name
 *      last_name
 *      preferred_name
 *      email
 *      role
 *      bio
 *      rank
 *      primary_department
 *      secondary_department
 *      primary_faculty
 *      secondary_faculty
 *      institution_user_id
 *      campus
 *      keywords
 *      scopus_id
 *      orcid_id
 *   }
 */
export const getUserInstitutionId = async (email) => {
  const results = await runGraphql(getUserInstitutionIdQuery(email));
  return results["data"]["getUser"];
};

/**
 * Function to get existing user data
 * Arguments:
 * institution_user_id
 * Return value:
 * {
 *      user_id
 *      first_name
 *      last_name
 *      preferred_name
 *      email
 *      role
 *      bio
 *      rank
 *      primary_department
 *      secondary_department
 *      primary_faculty
 *      secondary_faculty
 *      campus
 *      keywords
 *      institution_user_id
 *      scopus_id
 *      orcid_id
 *   }
 */
export const getExistingUser = async (institution_user_id) => {
  const results = await runGraphql(getExistingUserQuery(institution_user_id));
  return results["data"]["getExistingUser"];
};

/**
 * Function to get user cv data given the user id and the data section id
 * Arguments:
 * user_id
 * data_section_id - ID of the data section as returned by the getAllSections call (optional)
 * data_section_id_list - List of data section ids to retrieve data for (optional)
 * Must specify one of the two optional arguments
 * Return value:
 * {
 *      user_cv_data_id
 *      user_id
 *      data_section_id
 *      data_details: JSON string
 *      editable: Boolean
 * }
 */
export const getUserCVData = async (user_id, data_section_ids) => {
  const results = await runGraphql(
    getUserCVDataQuery(user_id, data_section_ids)
  );

  console.log(results["data"]["getUserCVData"]);
  return results["data"]["getUserCVData"];
};

/**
 * Function to get the archived user cv data given the user id
 * Arguments:
 * user_id
 * Return value:
 * {
 *      user_cv_data_id
 *      user_id
 *      data_section_id
 *      data_details: JSON string
 *      archive
 *      archive_timestamp
 *      editable
 * }
 */
export const getArchivedUserCVData = async (user_id) => {
  const results = await runGraphql(getArchivedUserCVDataQuery(user_id));
  return results["data"]["getArchivedUserCVData"];
};

/**
 * Function to get all university info
 * Return value:
 * [
 *  {
 *      university_info_id: Identifier for the university info in the DB
 *      type
 *      value
 *  }, ...
 * ]
 */
export const getAllUniversityInfo = async () => {
  const results = await runGraphql(getAllUniversityInfoQuery());
  return results["data"]["getAllUniversityInfo"];
};

export const GetNotifications = async () => {
  const results = await runGraphql(getAllNotificationsQuery());
  return results["data"]["GetNotifications"];
};

export const getUserDeclarations = async (first_name, last_name) => {
  const results = await runGraphql(
    getUserDeclarationsQuery(first_name, last_name)
  );
  return results["data"]["getUserDeclarations"];
};

/**
 * Function to get potential matches for an author using the Elsevier API
 * Arguments:
 * first_name
 * last_name
 * institution_name - optional (specify empty string if omitting)
 * Return value:
 * [
 *  {
 *      last_name
 *      first_name
 *      current_affiliation
 *      name_variants,
 *      subjects,
 *      scopus_id,
 *      orcid
 *  }, ...
 * ]
 */
export const getElsevierAuthorMatches = async (
  first_name,
  last_name,
  institution_name
) => {
  const results = await runGraphql(
    getElsevierAuthorMatchesQuery(first_name, last_name, institution_name)
  );
  return results["data"]["getElsevierAuthorMatches"];
};

/**
 * Function to get potential matches for an author using the Orcid API
 * Arguments:
 * first_name
 * last_name
 * institution_name optional (specify empty string if omitting)
 * Return value:
 * [
 *  {
 *      last_name
 *      first_name
 *      credit_name,
 *      name_variants,
 *      keywords,
 *      researcher_urls,
 *      orcid_id
 *  }, ...
 * ]
 */
export const getOrcidAuthorMatches = async (
  first_name,
  last_name,
  institution_name
) => {
  const results = await runGraphql(
    getOrcidAuthorMatchesQuery(first_name, last_name, institution_name)
  );
  return results["data"]["getOrcidAuthorMatches"];
};

export const getOrcidSections = async (orcidId, section) => {
  const results = await runGraphql(getOrcidSectionsQuery(orcidId, section));
  return results["data"]["getOrcidSections"];
};

export const getTotalOrcidPublications = async (orcid_id) => {
  const results = await runGraphql(getTotalOrcidPublicationsQuery(orcid_id));
  return results["data"]["getTotalOrcidPublications"];
};

export const getOrcidPublication = async (orcid_id, put_codes) => {
  const results = await runGraphql(
    getOrcidPublicationQuery(orcid_id, put_codes)
  );
  return results["data"]["getOrcidPublication"];
};

/*
 * Function to get user connections given the user id
 * Arguments:
 * user_id: string
 * isFaculty: boolean (optional, defaults to true)
 * Return value:
 * Array of objects:
 * {
 *      user_connection_id
 *      faculty_user_id
 *      faculty_first_name
 *      faculty_last_name
 *      faculty_email
 *      assistant_user_id
 *      assistant_first_name
 *      assistant_last_name
 *      assistant_email
 *      status
 * }
 */
export const getUserConnections = async (user_id, isFaculty = true) => {
  const query = getUserConnectionsQuery(user_id, isFaculty);
  const results = await runGraphql(query);
  return results["data"]["getUserConnections"];
};

/**
 * Function to get all templates
 * Return value:
 * [
 *  {
 *      template_id: Identifier for template in the DB
 *      title
 *      data_section_ids
 *      start_year
 *      end_year
 *  }, ...
 * ]
 */
export const getAllTemplates = async () => {
  const results = await runGraphql(getAllTemplatesQuery());
  return results["data"]["getAllTemplates"];
};

/**
 * Function to get teaching data matches from bulk loaded TTPS data
 * Arguments:
 * institution_user_id
 * Return value:
 * [
 *  {
 *      teaching_data_id
 *      user_id
 *      data_details: JSON string
 *  }, ...
 * ]
 */
export const getTeachingDataMatches = async (institution_user_id) => {
  const results = await runGraphql(
    getTeachingDataMatchesQuery(institution_user_id)
  );
  return results["data"]["getTeachingDataMatches"];
};

/**
 * Function to get publication matches using a user's scopus id
 * Arguments:
 * scopus_id
 * page_number - a zero-indexed page_number to fetch data for e.g. page 0 contains data from publications[0] to publications[results_per_page - 1] and so on
 * results_per_page
 * Return value: {
 *      publications [{
 *               publication_id
 *               title
 *               cited_by
 *               keywords
 *               journal
 *               link
 *               doi
 *               year_published
 *               author_names
 *               author_ids
 *       }, ...]
 *       total_results
 *       current_page
 *       total_pages
 *  }
 */
export const getPublicationMatches = async (
  scopus_id,
  page_number,
  results_per_page
) => {
  const results = await runGraphql(
    getPublicationMatchesQuery(scopus_id, page_number, results_per_page)
  );
  return results["data"]["getPublicationMatches"];
};

/**
 * Function to get secure funding matches from grants data
 * Arguments:
 * first_name,
 * last_name
 * Return value:
 * [
 *  {
 *      secure_funding_id
 *      first_name,
 *      last_name,
 *      data_details: JSON string
 *  }, ...
 * ]
 */
export const getSecureFundingMatches = async (first_name, last_name) => {
  const results = await runGraphql(
    getSecureFundingMatchesQuery(first_name, last_name)
  );
  return results["data"]["getSecureFundingMatches"];
};

/**
 * Function to get rise data matches from rise data
 * Arguments:
 * first_name,
 * last_name
 * Return value:
 * [
 *  {
 *      rise_data_id
 *      first_name,
 *      last_name
 *      data_details: JSON string
 *  }, ...
 * ]
 */
export const getRiseDataMatches = async (first_name, last_name) => {
  const results = await runGraphql(
    getRiseDataMatchesQuery(first_name, last_name)
  );
  return results["data"]["getRiseDataMatches"];
};

/**
 * Function to get patent matches from patents data
 * Arguments:
 * first_name,
 * last_name
 * Return value:
 * [
 *  {
 *      secure_funding_id
 *      first_name,
 *      last_name
 *      data_details: JSON string
 *  }, ...
 * ]
 */
export const getPatentMatches = async (first_name, last_name) => {
  const results = await runGraphql(
    getPatentMatchesQuery(first_name, last_name)
  );
  return results["data"]["getPatentMatches"];
};

/**
 * Function to get a presigned URL authorized to PUT or GET an object to/from a dedicated partition
 * in the CV S3 bucket for the tenant whose JWT token is passed
 * Arguments:
 * jwt - the jwt session token
 * fileKey - the key of the file to get the presigned URL for (assume that the S3 bucket is being used only by one tenant, partitions are handled by the resolver)
 * type - the type of operation (PUT or GET)
 * Return value:
 * String - the presigned URL
 */
export const getPresignedUrl = async (jwt, fileKey, type) => {
  const results = await runGraphql(getPresignedUrlQuery(jwt, fileKey, type));
  return results["data"]["getPresignedUrl"];
};

/**
 * Function to get the number of reports in the S3 bucket
 * Return value:
 * Integer - the number of reports in the S3 bucket
 */
export const getNumberOfGeneratedCVs = async (department) => {
  const results = await runGraphql(getNumberOfGeneratedCVsQuery(department));
  return results["data"]["getNumberOfGeneratedCVs"];
};

/**
 * Function to check if the CV needs updating
 * Arguments:
 * cognito_user_id
 * user_id
 * template_id
 * Return value:
 * Boolean: true or false
 */
export const cvIsUpToDate = async (cognito_user_id, user_id, template_id) => {
  const results = await runGraphql(
    cvIsUpToDateQuery(cognito_user_id, user_id, template_id)
  );
  return results["data"]["cvIsUpToDate"];
};

/**
 * Function to get CV formatting configuration
 * Return value:
 * String: JSON string with CV configuration
 */
export const getLatexConfiguration = async () => {
  const results = await runGraphql(getLatexConfigurationQuery());
  return results["data"]["getLatexConfiguration"];
};

// --- POST ---

/**
 * Function to add user to user group
 *
 */
export const addToUserGroup = async (userName, userGroup) => {
  const results = await runGraphql(addToUserGroupMutation(userName, userGroup));
  return results["data"]["addToUserGroup"];
};

/**
 * Function to remove user from user group
 *
 */
export const removeFromUserGroup = async (userName, userGroup) => {
  const results = await runGraphql(
    removeFromUserGroupMutation(userName, userGroup)
  );
  return results["data"]["removeFromUserGroup"];
};

/**
 * Function to add user CV data - the section info associated with a user
 * Arguments:
 * user_id - ID of the user the profile belongs to
 * data_section_id - ID of the data section as returned by the getAllSections call
 * data_details - JSON String
 * editable - Boolean
 * Return value:
 * String saying SUCCESS if call succeeded, anything else means call failed
 */
export const addUserCVData = async (
  user_id,
  data_section_id,
  data_details,
  editable = true
) => {
  const cognito_user_id = await getUserId();
  // console.log("data_details ", data_details);
  const results = await executeGraphql(ADD_USER_CV_DATA, {
    user_id: user_id,
    data_section_id: data_section_id,
    data_details: data_details,
    editable: editable,
    cognito_user_id: cognito_user_id,
  });
  return results["data"]["addUserCVData"];
};

export const addBatchedUserCVData = async (input) => {
  const results = await executeGraphql(ADD_BATCHED_USER_CV_DATA, input);
  return results["data"]["addBatchedUserCVData"];
};

/**
 * Function to add a section to data_sections table
 * Arguments:
 * title
 * description
 * data_type
 * attributes - JSON string with section data information
 * Return value:
 * String saying SUCCESS if call succeeded, anything else means call failed
 */
export const addSection = async (title, description, data_type, attributes) => {
  const results = await executeGraphql(ADD_SECTION, {
    title: title,
    description: description,
    data_type: data_type,
    attributes: attributes,
  });
  return results["data"]["addSection"];
};

/**
 * Function to add user data to the database
 * Arguments (Note - specify all arguments, send a null value or empty string if data unavailable):
 *      first_name
 *      last_name
 *      preferred_name
 *      email
 *      role
 *      bio
 *      rank
 *      primary_department
 *      secondary_department
 *      primary_faculty
 *      secondary_faculty
 *      campus
 *      keywords
 *      institution_user_id
 *      scopus_id
 *      orcid_id
 * Return value:
 * String saying SUCCESS if call succeeded, anything else means call failed
 */
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
    )
  );
  return results["data"]["addUser"];
};

/**
 * Function to add university info to university_info table
 * Arguments:
 * type
 * value
 * Return value:
 * String saying SUCCESS if call succeeded, anything else means call failed
 */
export const addUniversityInfo = async (type, value) => {
  const results = await runGraphql(addUniversityInfoMutation(type, value));
  return results["data"]["addUniversityInfo"];
};

/**
 * Function to add user connections
 * Arguments:
 * faculty_user_id - ID of the faculty user
 * faculty_first_name
 * faculty_last_name
 * faculty_email
 * assistant_user_id - ID of the assistant user
 * assistant_first_name
 * assistant_last_name
 * assistant_email
 * status
 * Return value:
 * String saying SUCCESS if call succeeded, anything else means call failed
 */
export const addUserConnection = async (
  faculty_user_id,
  faculty_first_name,
  faculty_last_name,
  faculty_email,
  assistant_user_id,
  assistant_first_name,
  assistant_last_name,
  assistant_email,
  status
) => {
  const results = await runGraphql(
    addUserConnectionMutation(
      faculty_user_id,
      faculty_first_name,
      faculty_last_name,
      faculty_email,
      assistant_user_id,
      assistant_first_name,
      assistant_last_name,
      assistant_email,
      status
    )
  );
  return results["data"]["addUserConnection"];
};

/**
 * Function to add template
 * Arguments:
 * title - title of template
 * data_section_ids - list of data section ids
 * start_year - start year of the template
 * end_year - end year of the template
 * Return value:
 * String saying SUCCESS if call succeeded, anything else means call failed
 */
export const addTemplate = async (
  title,
  data_section_ids,
  start_year,
  end_year
) => {
  const results = await runGraphql(
    addTemplateMutation(title, data_section_ids, start_year, end_year)
  );
  return results["data"]["addTemplate"];
};

/**
 * Function to link a user profile with a scopus id. To be used in conjunction with the getElsevierAuthorMatches function
 * Optionally, the orcid can be specified (if match is found with the scopus id returned by the getElsevierAuthorMatches function call)
 * Arguments:
 * user_id
 * scopus_id
 * orcid_id - optional
 * Return value:
 * String saying "Scopus ID linked successfully" if call succeeded, anything else means call failed
 */
export const linkScopusId = async (user_id, scopus_id, orcid_id) => {
  const results = await runGraphql(
    linkScopusIdMutation(user_id, scopus_id, orcid_id)
  );
  return results["data"]["linkScopusId"];
};

/**
 * Function to link a user profile with a orcid id. To be used in conjunction with the getOrcidAuthorMatches function
 * Arguments:
 * user_id
 * orcid_id
 * Return value:
 * String saying "Orcid ID linked successfully" if call succeeded, anything else means call failed
 */
export const linkOrcid = async (user_id, orcid_id) => {
  const results = await runGraphql(linkOrcidMutation(user_id, orcid_id));
  return results["data"]["linkOrcid"];
};

/**
 * Function to link bulk loaded teaching data to profile
 * Arguments:
 * user_id
 * data_details - JSON String
 * Return value:
 * String saying "Teaching data linked successfully" if call succeeded, anything else means call failed
 */
export const linkTeachingData = async (user_id, data_details) => {
  // First get the data_section_id for the teaching data
  const results = await getAllSections();
  const data_section_id = results.find(
    (section) => section.title === "Courses Taught"
  ).data_section_id;
  const status = await addUserCVData(
    user_id,
    data_section_id,
    JSON.stringify(data_details)
  );
  if (status === "SUCCESS") {
    return "Teaching data linked successfully";
  } else {
    return "Failed to link teaching data";
  }
};

/**
 * Function to link a publication to the user
 * Arguments:
 * user_id
 * data_details
 * Return value:
 * String saying "Publication linked successfully" if call succeeded, anything else means call failed
 */
export const linkPublication = async (user_id, data_details) => {
  // First get the data_section_id for the teaching data
  const results = await getAllSections();
  const data_section_id = results.find(
    (section) => section.title === "Publications"
  ).data_section_id;
  const status = await addUserCVData(
    user_id,
    data_section_id,
    JSON.stringify(data_details)
  );
  if (status === "SUCCESS") {
    return "Publication linked successfully";
  } else {
    return "Failed to link publication";
  }
};

// --- UPDATE ---

/**
 * Function to update user info
 * Arguments (Note - specify all arguments, send a null value or empty string if data unavailable):
 *      user_id
 *      first_name
 *      last_name
 *      preferred_name
 *      email
 *      role
 *      bio
 *      rank
 *      primary_department
 *      secondary_department
 *      primary_faculty
 *      secondary_faculty
 *      campus
 *      keywords
 *      institution_user_id
 *      scopus_id
 *      orcid_id
 * Return value:
 * String saying SUCCESS if call succeeded, anything else means call failed
 */
export const updateUser = async (
  user_id,
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
  const cognito_user_id = await getUserId();
  const results = await runGraphql(
    updateUserMutation(
      user_id,
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
      cognito_user_id
    )
  );
  return results["data"]["updateUser"];
};

/**
 * Function to update data section
 * Arguments:
 * data_section_id - ID of the data section
 * archive - Boolean
 * attributes - JSON string
 * Return value:
 * String saying SUCCESS if call succeeded, anything else means call failed
 */
export const updateSection = async (data_section_id, archive, attributes) => {
  const results = await runGraphql(
    updateSectionMutation(data_section_id, archive, attributes)
  );
  return results["data"]["updateSection"];
};

/**
 * Function to update user cv data - the section info associated with a user
 * Arguments:
 * user_cv_data_id - ID of the user cv data
 * data_details - JSON String
 * Return value:
 * String saying SUCCESS if call succeeded, anything else means call failed
 */
export const updateUserCVData = async (user_cv_data_id, data_details) => {
  const cognito_user_id = await getUserId();
  const results = await runGraphql(
    updateUserCVDataMutation(user_cv_data_id, data_details, cognito_user_id)
  );
  return results["data"]["updateUserCVData"];
};

/**
 * Function to update user cv data - the archive status
 * Arguments:
 * user_cv_data_id - ID of the user cv data
 * archive - Boolean
 * Return value:
 * String saying SUCCESS if call succeeded, anything else means call failed
 */
export const updateUserCVDataArchive = async (user_cv_data_id, archive) => {
  const cognito_user_id = await getUserId();
  const results = await runGraphql(
    updateUserCVDataArchiveMutation(user_cv_data_id, archive, cognito_user_id)
  );
  return results["data"]["updateUserCVDataArchive"];
};

/**
 * Function to update university info
 * Arguments (Note - specify all arguments, send a null value or empty string if data unavailable):
 *      university_info_id
 *      type
 *      value
 * Return value:
 * String saying SUCCESS if call succeeded, anything else means call failed
 */
export const updateUniversityInfo = async (university_info_id, type, value) => {
  const results = await runGraphql(
    updateUniversityInfoMutation(university_info_id, type, value)
  );
  return results["data"]["updateUniversityInfo"];
};

/**
 * Function to update user connections
 * Arguments:
 * user_connection_id - ID of the user connection
 * status - New status for the user connection
 * Return value:
 * String saying SUCCESS if call succeeded, anything else means call failed
 */
export const updateUserConnection = async (user_connection_id, status) => {
  const results = await runGraphql(
    updateUserConnectionMutation(user_connection_id, status)
  );
  return results["data"]["updateUserConnection"];
};

/**
 * Function to update user connections
 * Arguments:
 * template_id - ID of the template
 * title - title of the template
 * data_section_ids - list of data section ids
 * start_year - start year of the template
 * end_year - end year of the template
 * Return value:
 * String saying SUCCESS if call succeeded, anything else means call failed
 */
export const updateTemplate = async (
  template_id,
  title,
  data_section_ids,
  start_year,
  end_year
) => {
  const results = await runGraphql(
    updateTemplateMutation(
      template_id,
      title,
      data_section_ids,
      start_year,
      end_year
    )
  );
  return results["data"]["updateTemplate"];
};

/**
 * Function to update the configuration of the latex reports
 * Arguments:
 * vspace: Vertical spacing (in cm) between sections
 * margin: Margins (in cm)
 * font: Font name (TODO)
 * Return value:
 * String saying SUCCESS if call succeeded, anything else means call failed
 */
export const updateLatexConfiguration = async (vspace, margin, font) => {
  const results = await runGraphql(
    updateLatexConfigurationMutation(vspace, margin, font)
  );
  return results["data"]["updateTemplate"];
};

// --- DELETE ---

/**
 * Function to delete user connections
 * Arguments:
 * user_connection_id - ID of the user connection
 * Return value:
 * String saying SUCCESS if call succeeded, anything else means call failed
 */
export const deleteUserConnection = async (user_connection_id) => {
  const results = await runGraphql(
    deleteUserConnectionMutation(user_connection_id)
  );
  return results["data"]["deleteUserConnection"];
};

/**
 * Function to delete templates
 * Arguments:
 * template_id - ID of the template
 * Return value:
 * String saying SUCCESS if call succeeded, anything else means call failed
 */
export const deleteTemplate = async (template_id) => {
  const results = await runGraphql(deleteTemplateMutation(template_id));
  return results["data"]["deleteTemplate"];
};

/**
 * Function to add a user declaration
 * Arguments:
 *   input: {
 *     first_name, last_name, reporting_year, created_by, other_data (object)
 *   }
 * Return value:
 *   { id, created_on }
 */

export const addUserDeclaration = async (input) => {
  console.log(input);
  const results = await executeGraphql(ADD_USER_DECLARATION, {
    first_name: input.first_name,
    last_name: input.last_name,
    reporting_year: input.reporting_year,
    created_by: input.created_by,
    other_data: input.other_data,
  });
  return results["data"]["addUserDeclaration"];
};

export const updateUserDeclaration = async (input) => {
  const results = await executeGraphql(UPDATE_USER_DECLARATION, {
    first_name: input.first_name,
    last_name: input.last_name,
    reporting_year: input.reporting_year,
    other_data: input.other_data,
  });
  return results["data"]["updateUserDeclaration"];
};

export const deleteUserDeclaration = async (
  first_name,
  last_name,
  reporting_year
) => {
  const results = await executeGraphql(DELETE_USER_DECLARATION, {
    first_name: first_name,
    last_name: last_name,
    reporting_year: reporting_year,
  });
  return results["data"]["deleteUserDeclaration"];
};

export const getBioResponseData = async (username_input) => {
  const results = await executeGraphql(GET_BIO_RESPONSE_DATA, {
    username_input: username_input,
  });
  return results["data"]["getBioResponseData"];
}
