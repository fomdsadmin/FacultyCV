import { generateClient } from 'aws-amplify/api';
import { getAllSectionsQuery, getUserCVDataQuery, getUserQuery, getAllUniversityInfoQuery, 
    getElsevierAuthorMatchesQuery, getExistingUserQuery, getUserConnectionsQuery, 
    getArchivedUserCVDataQuery, getOrcidAuthorMatchesQuery, getAllTemplatesQuery, 
    getTeachingDataMatchesQuery,
    getPublicationMatchesQuery} from './queries';
import { addSectionMutation, addUserCVDataMutation, addUserMutation, 
    addUniversityInfoMutation, updateUserCVDataMutation, updateUserMutation, 
    updateUniversityInfoMutation, linkScopusIdMutation, addUserConnectionMutation, 
    updateUserConnectionMutation, deleteUserConnectionMutation, updateUserCVDataArchiveMutation, 
    linkOrcidMutation, addTemplateMutation, updateTemplateMutation, deleteTemplateMutation } from './mutations';

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
    return results['data']['getExistingUser'];
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
 * }
 */
export const getArchivedUserCVData = async (user_id) => {
    const results = await runGraphql(getArchivedUserCVDataQuery(user_id));
    return results['data']['getArchivedUserCVData'];
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
export const getElsevierAuthorMatches = async (first_name, last_name, institution_name) => {
    const results = await runGraphql(getElsevierAuthorMatchesQuery(first_name, last_name, institution_name))
    return results['data']['getElsevierAuthorMatches'];
}

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
export const getOrcidAuthorMatches = async (first_name, last_name, institution_name) => {
    const results = await runGraphql(getOrcidAuthorMatchesQuery(first_name, last_name, institution_name))
    return results['data']['getOrcidAuthorMatches'];
};

/*
 * Function to get user connections given the user id
 * Arguments:
 * user_id
 * Return value:
 * {
 *      user_connection_id
 *      user_id
 *      user_connection: JSON string
 * }
 */
export const getUserConnections = async (user_id) => {
    const results = await runGraphql(getUserConnectionsQuery(user_id));
    return results['data']['getUserConnections'];
}

/**
 * Function to get all templates
 * Return value:
 * [
 *  {
 *      template_id: Identifier for template in the DB
 *      title
 *      data_section_ids
 *  }, ...
 * ]
 */
export const getAllTemplates = async () => {
    const results = await runGraphql(getAllTemplatesQuery())
    return results['data']['getAllTemplates'];
}

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
    const results = await runGraphql(getTeachingDataMatchesQuery(institution_user_id));
    return results['data']['getTeachingDataMatches'];
}

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
export const getPublicationMatches = async (scopus_id, page_number, results_per_page) => {
    const results = await runGraphql(getPublicationMatchesQuery(scopus_id, page_number, results_per_page));
    return results['data']['getPublicationMatches'];
}

// --- PUT ---

/**
 * Function to update user data
 * Arguments (Note - specify all arguments, send a null value or empty string if data unavailable):
 *      user_id
 *      first_name
 *      last_name
 *      preferred_name
 *      email

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

/**
 * Function to add user connections
 * Arguments:
 * user_id - ID of the user the profile belongs to
 * user_connection - JSON String
 * Return value:
 * String saying SUCCESS if call succeeded, anything else means call failed
 */
export const addUserConnection = async (user_id, user_connection) => {
    const results = await runGraphql(addUserConnectionMutation(user_id, user_connection));
    return results['data']['addUserConnection'];
}

/**
 * Function to add template
 * Arguments:
 * title - title of template
 * data_section_ids - list of data section ids
 * Return value:
 * String saying SUCCESS if call succeeded, anything else means call failed
 */
export const addTemplate = async (title, data_section_ids) => {
    const results = await runGraphql(addTemplateMutation(title, data_section_ids));
    return results['data']['addTemplate'];
}

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
    const results = await runGraphql(linkScopusIdMutation(user_id, scopus_id, orcid_id));
    return results['data']['linkScopusId'];
}

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
    return results['data']['linkOrcid'];
}

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
    const data_section_id = results.find(section => section.title === "Courses taught").data_section_id;
    const status =  await addUserCVData(user_id, data_section_id, JSON.stringify(data_details));
    if (status === "SUCCESS") {
        return "Teaching data linked successfully";
    } else {
        return "Failed to link teaching data";
    }
}

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
    const data_section_id = results.find(section => section.title === "Publications").data_section_id;
    const status =  await addUserCVData(user_id, data_section_id, JSON.stringify(data_details));
    if (status === "SUCCESS") {
        return "Publication linked successfully";
    } else {
        return "Failed to link publication";
    }
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
 * user_cv_data_id - ID of the user cv data
 * data_details - JSON String
 * Return value:
 * String saying SUCCESS if call succeeded, anything else means call failed
 */
export const updateUserCVData = async (user_cv_data_id, data_details) => {
    const results = await runGraphql(updateUserCVDataMutation(user_cv_data_id, data_details));
    return results['data']['updateUserCVData'];
}

/**
 * Function to update user cv data - the archive status
 * Arguments:
 * user_cv_data_id - ID of the user cv data
 * archive - Boolean
 * Return value:
 * String saying SUCCESS if call succeeded, anything else means call failed
 */
export const updateUserCVDataArchive = async (user_cv_data_id, archive) => {
    const results = await runGraphql(updateUserCVDataArchiveMutation(user_cv_data_id, archive));
    return results['data']['updateUserCVDataArchive'];
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

/**
 * Function to update user connections
 * Arguments:
 * user_connection_id - ID of the user connection
 * user_connection - JSON String
 * Return value:
 * String saying SUCCESS if call succeeded, anything else means call failed
 */
export const updateUserConnection = async (user_connection_id, user_connection) => {
    const results = await runGraphql(updateUserConnectionMutation(user_connection_id, user_connection));
    return results['data']['updateUserConnection'];
}

/**
 * Function to update user connections
 * Arguments:
 * template_id - ID of the template
 * title - title of the template
 * data_section_ids - list of data section ids
 * Return value:
 * String saying SUCCESS if call succeeded, anything else means call failed
 */
export const updateTemplate = async (template_id, title, data_section_ids) => {
    const results = await runGraphql(updateTemplateMutation(template_id, title, data_section_ids));
    return results['data']['updateTemplate'];
}

// --- DELETE ---

/**
 * Function to delete user connections
 * Arguments:
 * user_connection_id - ID of the user connection
 * Return value:
 * String saying SUCCESS if call succeeded, anything else means call failed
 */
export const deleteUserConnection = async (user_connection_id) => {
    const results = await runGraphql(deleteUserConnectionMutation(user_connection_id));
    return results['data']['deleteUserConnection'];
}

/**
 * Function to delete templates
 * Arguments:
 * template_id - ID of the template
 * Return value:
 * String saying SUCCESS if call succeeded, anything else means call failed
 */
export const deleteTemplate = async (template_id) => {
    const results = await runGraphql(deleteTemplateMutation(template_id));
    return results['data']['deleteTemplate'];
}