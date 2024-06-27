import { generateClient } from 'aws-amplify/api';
import { getAllSectionsQuery } from './queries';
/**
 * Function to get all sections that are part of the schema
 * Return value:
 * [
 *  {
 *      attributes: JSON object with placeholder value - used to determine the structure (and not the actual data) of the section
 *      dataSectionId: Identifier for the section in the DB
 *      dataType: Umbrella term for the section
 *      description
 *      title  
 *  }, ...
 * ]
 */
export const getAllSections = async () => {
    const client = generateClient();
    const results = await client.graphql({
        query: getAllSectionsQuery()
    });
    return results['data']['getAllSections']
}