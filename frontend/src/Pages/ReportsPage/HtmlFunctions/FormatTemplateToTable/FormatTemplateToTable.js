import { getAllSections } from "graphql/graphqlHelpers";
import { getUserCVData } from "graphql/graphqlHelpers";
import { getUserDeclarations } from "graphql/graphqlHelpers";
import { normalizeDeclarations } from "Pages/Declarations/Declarations";
import { getUserAffiliations } from "graphql/graphqlHelpers";
import { templateDataStore } from "./TemplateDataStore";
import { formatTableItems } from "./FormatItems";


export const formatUserTables = async (userInfoInput, templateWithEndStartDate) => {
    const userProfiles = [];
    const userInfoArray = Array.isArray(userInfoInput) ? userInfoInput : [userInfoInput];

    // Initialize singleton with immutable data
    templateDataStore.initializeTemplate(templateWithEndStartDate);
    templateDataStore.initializeSortAscending(JSON.parse(templateWithEndStartDate.template_structure).sort_ascending);

    // Get all sections data once (shared for all users)
    const allSections = await getAllSections();
    const allSectionIds = allSections.map((section) => section.data_section_id);

    // Initialize sectionsMap in singleton
    const sectionsMapData = {};
    allSections.forEach((section) => {
        sectionsMapData[section.title] = section;
    });
    templateDataStore.initializeSectionsMap(sectionsMapData);

    const sectionsTitleMap = {};
    allSections.forEach((section) => {
        sectionsTitleMap[section.data_section_id] = section.title;
    });

    // Process each user
    for (let userIndex = 0; userIndex < userInfoArray.length; userIndex++) {
        let userProfile = {};
        const currentUserInfo = userInfoArray[userIndex];
        console.log(`Building CV for user ${userIndex + 1}/${userInfoArray.length}:`, currentUserInfo.first_name, currentUserInfo.last_name);

        // Get user-specific CV data
        const unparsedData = await getUserCVData(currentUserInfo.user_id, allSectionIds);

        // Parse user data and create userCvDataMap for this user
        const userCvData = unparsedData.map((data) => {
            let dataDetails;
            try {
                dataDetails = JSON.parse(data.data_details);
            } catch (e) {
                dataDetails = data.data_details;
            }
            return { ...data, data_details: dataDetails };
        });

        // Create userCvDataMap with title as key and array of CV data as value
        const newUserCvDataMap = {};

        for (const cvData of userCvData) {
            const sectionId = cvData.data_section_id;
            const sectionTitle = sectionsTitleMap[sectionId];

            // Replace undefined or null values with empty strings
            const cleanedCvData = Object.fromEntries(
                Object.entries(cvData).map(([key, value]) => [key, value ?? ""])
            );

            if (!newUserCvDataMap[sectionTitle]) {
                newUserCvDataMap[sectionTitle] = [];
            }

            newUserCvDataMap[sectionTitle].push(cleanedCvData);
        }

        // Set mutable data in singleton
        templateDataStore.setUserCvDataMap(newUserCvDataMap);

        // Build user profile section
        userProfile = await buildUserProfile(currentUserInfo);

        // Parse the template structure and process each group
        const items = JSON.parse(templateDataStore.getTemplate().template_structure).templateBuilder.items;
        console.log("JJFILTER items", items);
        userProfile["items"] = formatTableItems(items);



        console.log(`Completed CV for user ${userIndex + 1}/${userInfoArray.length}`);
        userProfiles.push(userProfile);
    }


    console.log("JJFILTER userprofiles", userProfiles);
    return userProfiles;
};

const buildUserProfile = async (userInfoParam) => {
    // Set mutable userInfo in singleton
    templateDataStore.setUserInfo(userInfoParam);
    const userInfo = templateDataStore.getUserInfo();
    const template = templateDataStore.getTemplate();
    const sortAscending = templateDataStore.getSortAscending();

    const response = await getUserAffiliations(userInfo.user_id, userInfo.first_name, userInfo.last_name);

    let userAfiliations;

    if (response && response.length > 0 && response[0].data_details) {
        let data = response[0].data_details;
        if (typeof data === "string") {
            try {
                data = JSON.parse(data);
                if (typeof data === "string") {
                    data = JSON.parse(data);
                }
            } catch (e) {
                console.error("Error parsing affiliations data:", e, data);
                data = {};
            }
        }
        userAfiliations = data;
    }


    const fetchDeclarations = async (user_id) => {
        try {
            const result = await getUserDeclarations(user_id);
            // Normalize the API response to match the UI's expected format
            return normalizeDeclarations(result);
        } catch (error) {
            console.error("Error fetching declarations:", error);
        }
        return [];
    };

    let userDeclarations = null;
    let declarationToUse = null;
    if (JSON.parse(template.template_structure).show_declaration) {
        userDeclarations = await fetchDeclarations(userInfo.user_id);

        declarationToUse = userDeclarations.find(
            (declaration) => template.start_year <= declaration.year && template.end_year >= declaration.year
        );
    }

    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    // Parse joined timestamp to get rank start date
    const joinedDate = new Date(userInfo.joined_timestamp);

    const startYear = template.start_year || 'All';
    const endYear = template.end_year || 'Present';
    const sortOrder = sortAscending ? 'Ascending' : 'Descending';
    const dateRangeText = `(${startYear} - ${endYear}, ${sortOrder})`;

    const userProfile = {
        current_date: currentDate,
        joined_date: joinedDate,
        start_year: startYear,
        end_year: endYear,
        sort_order: sortOrder,
        date_range_text: dateRangeText,
        template_title: template.title,
        declaration_to_use: declarationToUse,
        ...userInfoParam,
        ...userAfiliations
    }

    return userProfile;
};
