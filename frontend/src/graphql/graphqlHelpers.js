import { generateClient } from 'aws-amplify/api';
import { getAllSectionsQuery, getUserCVDataQuery, getUserQuery, getAllUniversityInfoQuery } from './queries';
import { addSectionMutation, addUserCVDataMutation, addUserMutation, addUniversityInfoMutation, updateUserCVDataMutation, updateUserMutation, updateUniversityInfoMutation } from './mutations';

const runGraphql = async (query) => {
    const client = generateClient();
    const results = await client.graphql({
        query: query
    });
    return results;
}

// --- GET ---

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
    const results = await runGraphql(getAllSectionsQuery())
    return results['data']['getAllSections'];
}

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
 *      institution_user_id
 *      scopus_id
 *      orcid_id
 *   }
 */
export const getUser = async (email) => {
    const results = await runGraphql(getUserQuery(email));
    return results['data']['getUser'];
}

/**
 * Function to get user cv data given the user id and the data section id
 * Arguments:
 * user_id
 * data_section_id - ID of the data section as returned by the getAllSections call
 * Return value:
 * {
 *      user_cv_data_id
 *      user_id
 *      data_section_id
 *      data_details: JSON string
 * }
 */
export const getUserCVData = async (user_id, data_section_id) => {
    const results = await runGraphql(getUserCVDataQuery(user_id, data_section_id));
    return results['data']['getUserCVData'];
}

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
    const results = await runGraphql(getAllUniversityInfoQuery())
    return results['data']['getAllUniversityInfo'];
}

// --- POST ---

/**
 * Function to add user CV data - the section info associated with a user
 * Arguments:
 * user_id - ID of the user the profile belongs to
 * data_section_id - ID of the data section as returned by the getAllSections call
 * data_details - JSON String
 * Return value:
 * String saying SUCCESS if call succeeded, anything else means call failed
 */
export const addUserCVData = async (user_id, data_section_id, data_details) => {
    const results = await runGraphql(addUserCVDataMutation(user_id, data_section_id, data_details));
    return results['data']['addUserCVData'];
}


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
    const results = await runGraphql(addSectionMutation(title, description, data_type, attributes));
    return results['data']['addSection'];
}


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
export const addUser = async (first_name, last_name, preferred_name,
    email, role, bio, rank, primary_department, secondary_department, primary_faculty,
    secondary_faculty, campus, keywords, institution_user_id, scopus_id, orcid_id) => {
        const results = await runGraphql(addUserMutation(
            first_name, last_name, preferred_name,
            email, role, bio, rank, primary_department, 
            secondary_department, primary_faculty,
            secondary_faculty, campus, keywords,
            institution_user_id, scopus_id, orcid_id
        ));
        return results['data']['addUser'];
}

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
    return results['data']['addUniversityInfo'];
}

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
export const updateUser = async (user_id, first_name, last_name, preferred_name,
    email, role, bio, rank, primary_department, secondary_department, primary_faculty,
    secondary_faculty, campus, keywords, institution_user_id, scopus_id, orcid_id) => {
        const results = await runGraphql(updateUserMutation(
            user_id, first_name, last_name, preferred_name,
            email, role, bio, rank, primary_department, 
            secondary_department, primary_faculty,
            secondary_faculty, campus, keywords,
            institution_user_id, scopus_id, orcid_id
        ));
        return results['data']['updateUser'];
}

/**
 * Function to update user cv data - the section info associated with a user
 * Arguments:
 * user_id - ID of the user the profile belongs to
 * data_section_id - ID of the data section as returned by the getAllSections call
 * data_details - JSON String
 * Return value:
 * String saying SUCCESS if call succeeded, anything else means call failed
 */
export const updateUserCVData = async (user_id, data_section_id, data_details) => {
    const results = await runGraphql(updateUserCVDataMutation(user_id, data_section_id, data_details));
    return results['data']['updateUserCVData'];
}

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
        const results = await runGraphql(updateUniversityInfoMutation(
            university_info_id, type, value
        ));
        return results['data']['updateUniversityInfo'];
}