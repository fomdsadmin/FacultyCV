import { getAllSections, getUserCVData } from '../../../graphql/graphqlHelpers.js';
import { SHOWN_ATTRIBUTE_GROUP_ID, HIDDEN_ATTRIBUTE_GROUP_ID, HIDDEN_GROUP_ID } from '../../TemplatePages/SharedTemplatePageComponents/TemplateModifier/TemplateModifierContext.jsx'
import { cellRowBuilder, generateColumnFormatViaRatioArray, sanitizeRichText, textOptions } from './HtmlTableBuilder.js';

let userCvDataMap = {}
let sectionsMap = {};
const rowNumberColumnRatio = 3;
let template = {};
let sortAscending;
let userInfo;

const DO_NOT_FILTER_SECTIONS = [
    '7a. Leaves of Absence',
    '6[a-d]. Employment Record',
    '5c. Continuing Education or Training',
    '5d. Continuing Medical Education',
    '5e. Professional Qualifications, Certifications and Licenses',
    '5b. Dissertations',
    '5a. Post-Secondary Education'
]

const buildTableHeader = (title) => {
    const columnWidths = generateColumnFormatViaRatioArray([1]);
    const headerRowData = [{
        textOptions: [textOptions(title, true, null)], // text, bold=true, size=null
        color: 'headerGray'
    }];

    return cellRowBuilder(headerRowData, columnWidths);
}

// Helper function to get CV data for a section
const getUserCvDataMap = (dataSectionId) => {
    return userCvDataMap[dataSectionId] || [];
};

const buildTableSubHeader = (preparedSection) => {
    let titleToDisplay = preparedSection.renamed_section_title || preparedSection.title;

    if (preparedSection.show_row_count) {
        let sectionData = getUserCvDataMap(preparedSection.data_section_id);
        sectionData = filterDateRanges(sectionData, preparedSection.data_section_id);
        const rowCount = sectionData.length;
        titleToDisplay += ` (${rowCount})`
    }

    const columnWidths = generateColumnFormatViaRatioArray([1]);
    const subHeaderRowData = [{
        textOptions: [textOptions(titleToDisplay, true, null)], // text, bold=true, size=null
        color: 'subHeaderGray'
    }];

    return cellRowBuilder(subHeaderRowData, columnWidths);
}

const sortSectionData = (sectionData, dataSectionId) => {
    // Find the section to get the attribute mapping
    const section = sectionsMap[dataSectionId];
    if (!section) {
        console.warn(`Section not found for dataSectionId: ${dataSectionId}`);
        return sectionData;
    }

    let dateAttribute = null;

    if (sectionData.length !== 0) {
        if (sectionData[0]["data_details"]["dates"]) {
            dateAttribute = "dates";
        } else if (sectionData[0]["data_details"]["end_date"]) {
            dateAttribute = "end_date";
        }
    }

    if (dateAttribute === null) {
        return sectionData;
    }

    return sectionData.sort((a, b) => {
        const cleanedA = a["data_details"][dateAttribute].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const cleanedB = b["data_details"][dateAttribute].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

        const monthMatchA = cleanedA.match(/[A-Za-z]+/);
        const yearMatchA = cleanedA.match(/\d+/);
        const monthMatchB = cleanedB.match(/[A-Za-z]+/);
        const yearMatchB = cleanedB.match(/\d+/);

        // Handle null matches with fallbacks
        const yearA = yearMatchA ? parseInt(yearMatchA[0]) : 0;
        const monthA = monthMatchA ? monthMatchA[0] : null;
        const yearB = yearMatchB ? parseInt(yearMatchB[0]) : 0;
        const monthB = monthMatchB ? monthMatchB[0] : null;

        // Sort by year
        const yearComparison = yearA - yearB;

        if (yearComparison === 0 && monthA && monthB) {
            // Convert month names to numbers for comparison
            const monthToNumber = {
                'january': 1, 'jan': 1,
                'february': 2, 'feb': 2,
                'march': 3, 'mar': 3,
                'april': 4, 'apr': 4,
                'may': 5,
                'june': 6, 'jun': 6,
                'july': 7, 'jul': 7,
                'august': 8, 'aug': 8,
                'september': 9, 'sep': 9, 'sept': 9,
                'october': 10, 'oct': 10,
                'november': 11, 'nov': 11,
                'december': 12, 'dec': 12
            };

            const monthNumA = monthToNumber[monthA.toLowerCase()] || 0;
            const monthNumB = monthToNumber[monthB.toLowerCase()] || 0;

            const monthComparison = monthNumA - monthNumB;

            // Apply ascending/descending order
            return sortAscending ? monthComparison : -monthComparison;
        }

        // Apply ascending/descending order based on sortAscending
        return sortAscending ? yearComparison : -yearComparison;
    });
};

const filterDateRanges = (sectionData, dataSectionId) => {
    // Find the section to get attribute mappings
    const section = sectionsMap[dataSectionId];
    if (!section) {
        return sectionData;
    }

    // Skip filtering for sections in DO_NOT_FILTER_SECTIONS
    if (DO_NOT_FILTER_SECTIONS.includes(section.title)) {
        return sectionData;
    }

    // If no template date range is specified, return all data
    if (!template.start_year && !template.end_year) {
        return sectionData;
    }

    const attributeMapping = JSON.parse(section.attributes);

    // Look for date-related attributes (year or date)
    const yearAttribute = attributeMapping['Year'] || attributeMapping['Year Published'];
    const dateAttribute = attributeMapping['Date'];

    return sectionData.filter((data) => {
        let endYear = null;

        // Try to extract end year from year attribute first
        if (yearAttribute && data.data_details[yearAttribute]) {
            const yearValue = String(data.data_details[yearAttribute]);
            const yearMatch = yearValue.match(/\d{4}/g);
            if (yearMatch) {
                // If multiple years found, take the last one (end year)
                endYear = parseInt(yearMatch[yearMatch.length - 1]);
            }
        }

        // If no year found, try to extract from date attribute
        if (!endYear && dateAttribute && data.data_details[dateAttribute]) {
            const dateValue = String(data.data_details[dateAttribute]);
            endYear = extractEndYearFromDateRange(dateValue);
        }

        // If we couldn't extract any end year, include the item (conservative approach)
        if (!endYear) {
            return true;
        }

        // Apply template date filters
        let includeItem = true;

        if (template.start_year) {
            includeItem = includeItem && (endYear >= parseInt(template.start_year));
        }

        if (template.end_year) {
            includeItem = includeItem && (endYear <= parseInt(template.end_year));
        }

        return includeItem;
    });
};

const extractEndYearFromDateRange = (dateString) => {
    // Handle "Current" case
    if (dateString.toLowerCase().includes('current')) {
        return new Date().getFullYear(); // Use current year
    }

    // Split by common separators to find date ranges
    const rangeSeparators = [' - ', ' – ', ' — ', ' to ', '-', '–', '—'];
    let parts = [dateString];

    for (const separator of rangeSeparators) {
        if (dateString.includes(separator)) {
            parts = dateString.split(separator);
            break;
        }
    }

    // If we have a range, take the last part (end date)
    const endDatePart = parts.length > 1 ? parts[parts.length - 1].trim() : parts[0].trim();

    // Extract year from the end date part
    // Look for 4-digit years
    const yearMatch = endDatePart.match(/\d{4}/);
    if (yearMatch) {
        return parseInt(yearMatch[0]);
    }

    // If no 4-digit year, try 2-digit year and assume 19xx or 20xx
    const twoDigitMatch = endDatePart.match(/\d{2}$/);
    if (twoDigitMatch) {
        const twoDigitYear = parseInt(twoDigitMatch[0]);
        // Assume years 00-30 are 2000s, 31-99 are 1900s
        return twoDigitYear <= 30 ? 2000 + twoDigitYear : 1900 + twoDigitYear;
    }

    return null; // Couldn't extract year
};

// Handle publication-specific logic (author name bolding, DOI links)
const buildPublicationRowArray = (data, attributes, section) => {
    const AUTHOR_NAMES = "Author Names";
    const AUTHOR_IDS = "Author Ids";
    const sectionAttributes = JSON.parse(section.attributes);

    return attributes.map((attribute) => {
        // Handle author names specially for publications
        if (attribute === 'Author Names') {
            const authorNames = data.data_details[sectionAttributes[AUTHOR_NAMES]];
            const authorIds = data.data_details[sectionAttributes[AUTHOR_IDS]];

            // Safe check for authorIds and userInfo.scopus_id
            const indexOfThisAuthor = (authorIds && Array.isArray(authorIds) && userInfo?.scopus_id)
                ? authorIds.indexOf(userInfo.scopus_id)
                : -1;

            // Check if authorNames is an array before mapping
            if (!Array.isArray(authorNames)) {
                console.warn('authorNames is not an array:', authorNames);
                return {
                    textOptions: [textOptions(String(authorNames || ''), false, 9.5)],
                    color: null
                };
            }

            // Create individual textOptions for each author
            const authorTextOptions = authorNames.map((authorName, index) =>
                textOptions(authorName, index === indexOfThisAuthor, 9.5)
            );

            return {
                textOptions: authorTextOptions,
                color: null
            };
        }

        // Handle DOI links
        if (attribute === 'Doi') {
            const doi = data.data_details[sectionAttributes[attribute]];
            if (doi && doi.trim() !== '') {
                const doiLink = `https://doi.org/${doi}`;
                return {
                    textOptions: [textOptions(doi, false, 9.5, doiLink)],
                    color: null
                };
            }
        }

        // Regular attribute handling
        const tabData = data.data_details[sectionAttributes[attribute]] || '';
        return {
            textOptions: [textOptions(tabData, false, 9.5)],
            color: null
        };
    });
};

// Handle regular sections (non-publication)
const buildRegularRowArray = (data, attributes, section) => {
    const sectionAttributes = JSON.parse(section.attributes);

    return attributes.map((attribute) => {
        const tabData = data.data_details[sectionAttributes[attribute]] || '';
        return {
            textOptions: [textOptions(tabData, false, 9.5)],
            color: null
        };
    });
};

// Add row number column to the beginning of row array
const addRowNumberColumn = (rowArray, rowCount) => {
    rowArray.unshift({
        textOptions: [textOptions(String(rowCount + 1), false, 9.5)],
        color: null
    });
    return rowArray;
};

// Generate column widths based on merge and row number options
const generateDataColumnWidths = (attributes, preparedSection) => {
    if (!preparedSection.merge_visible_attributes) {
        // Normal case: each attribute gets its own column
        if (!preparedSection.include_row_number_column) {
            return generateColumnFormatViaRatioArray(attributes.map(() => 1));
        } else {
            const ratioArray = attributes.map(() => rowNumberColumnRatio);
            ratioArray.unshift(1);
            return generateColumnFormatViaRatioArray(ratioArray);
        }
    } else {
        // Merged case: only one column for all merged attributes
        if (!preparedSection.include_row_number_column) {
            return generateColumnFormatViaRatioArray([1]); // Single column
        } else {
            return generateColumnFormatViaRatioArray([1, 18]); // Row number + merged content
        }
    }
};

const buildGrantsAndContractsRowArray = (data, attributes, section) => {
    const sectionAttributes = JSON.parse(section.attributes);

    return attributes.map((attribute) => {
        const tabData = data.data_details[sectionAttributes[attribute]] || '';
        const makeAgencyBlank = (attribute === "Agency" && tabData.toLowerCase() === "rise");

        return {
            textOptions: [textOptions(makeAgencyBlank ? "" : tabData, false, 9.5)],
            color: null
        };
    });
}

// Main buildDataEntries function - now much cleaner
const buildDataEntries = (preparedSection, dataSectionId) => {
    const PUBLICATION_SECTION_ID = "1c23b9a0-b6b5-40b8-a4aa-f822d0567f09";
    const RESEARCH_OR_EQUIVALENT_GRANTS_AND_CONTRACTS_ID = "26939d15-7ef9-46f6-9b49-22cf95074e88";

    const attributeGroups = preparedSection.attribute_groups;
    const displayedAttributeGroups = attributeGroups.filter((attributeGroup) => attributeGroup.id !== HIDDEN_ATTRIBUTE_GROUP_ID);
    const attributes = displayedAttributeGroups.flatMap((attributeGroup) => attributeGroup.attributes);

    // Get section data using helper function
    let sectionData = getUserCvDataMap(dataSectionId);

    // Apply date range filtering
    sectionData = filterDateRanges(sectionData, dataSectionId);

    // Apply sorting
    sectionData = sortSectionData(sectionData, dataSectionId);

    // This means the section passed in is a mapped section, and the rows of data inserted must be filtered based on the type dropdown value selected
    if (preparedSection.attribute_filter_value) {
        sectionData = sectionData.filter((sectionData) => sectionData[preparedSection.section_by_type] !== preparedSection.attribute_filter_value);
    }

    // Generate HTML tables for each entry
    const htmlTables = sectionData.map((data, rowCount) => {
        const section = sectionsMap[dataSectionId];

        // Safety check for section and data
        if (!section || !data || !data.data_details) {
            console.warn('Missing section or data:', { section, data, dataSectionId });
            return '';
        }

        // Build row array based on section type
        let rowArray;
        if (section.data_section_id === PUBLICATION_SECTION_ID) {
            rowArray = buildPublicationRowArray(data, attributes, section);
        } else if (section.data_section_id === RESEARCH_OR_EQUIVALENT_GRANTS_AND_CONTRACTS_ID) {
            rowArray = buildGrantsAndContractsRowArray(data, attributes, section);
        } else {
            rowArray = buildRegularRowArray(data, attributes, section);
        }

        // Add row number column if needed
        if (preparedSection.include_row_number_column) {
            rowArray = addRowNumberColumn(rowArray, rowCount);
        }

        // Generate column widths
        const dataColumnWidths = generateDataColumnWidths(attributes, preparedSection);

        // Use cellRowBuilder with mergeCells option
        return cellRowBuilder(
            rowArray,
            dataColumnWidths,
            preparedSection.merge_visible_attributes,
            !preparedSection.include_row_number_column
        );
    });

    // Join all individual tables, filtering out empty ones
    return htmlTables.filter(table => table.trim() !== '').join('\n');
}

const buildTableAttributeGroup = (attributeGroups, attributeRenameMap) => {
    const columnRatioArray = [];
    let groupedColumnNamesArray = [];

    for (const attributeGroup of attributeGroups.filter((attributeGroup) => attributeGroup.id !== HIDDEN_ATTRIBUTE_GROUP_ID)) {
        const title = attributeGroup.id !== SHOWN_ATTRIBUTE_GROUP_ID ? attributeRenameMap[attributeGroup.title] || attributeGroup.title : '~';
        // Create the cell object in the format cellRowBuilder expects
        const cellObject = {
            textOptions: [textOptions(title, true, 11)], // text, bold=true, size='small'
            color: 'columnGray'
        };

        groupedColumnNamesArray.push(cellObject);

        var ratio = attributeGroup.attributes.length;
        columnRatioArray.push(ratio);
    }

    const columnWidths = generateColumnFormatViaRatioArray(columnRatioArray);
    const groupedColumnHeader = cellRowBuilder(groupedColumnNamesArray, columnWidths);

    return groupedColumnHeader;
}

const buildTableSectionColumns = (preparedSection) => {
    let html = "";

    const attributeGroups = preparedSection.attribute_groups;
    const attributeRenameMap = preparedSection.attribute_rename_map;

    // take into account hidden and shown attribute group
    if (attributeGroups.length > 2) {
        html += buildTableAttributeGroup(attributeGroups, attributeRenameMap);
    }

    const displayedAttributeGroups = attributeGroups.filter((attributeGroup) => attributeGroup.id !== HIDDEN_ATTRIBUTE_GROUP_ID);
    const attributes = displayedAttributeGroups.flatMap((attributeGroup) => attributeGroup.attributes);

    var columnWidths;
    if (!preparedSection.include_row_number_column) {
        // Dynamically create the column widths based on the number of attributes
        columnWidths = generateColumnFormatViaRatioArray(attributes.map(() => 1));
    } else {
        const customAttributeRatio = attributes.map(() => rowNumberColumnRatio);
        customAttributeRatio.unshift(1);
        columnWidths = generateColumnFormatViaRatioArray(customAttributeRatio);
        attributes.unshift("Row #");
    }

    // Create header row data using textOptions format
    const headerRowData = attributes.map((attribute) => ({
        textOptions: [textOptions(attributeRenameMap[attribute] || attribute, true, null)], // text, bold=true, size=null
        color: 'columnGray'
    }));

    html += cellRowBuilder(headerRowData, columnWidths);

    return html;
}

const buildSubSections = (preparedSectionWithSubSections) => {
    let html = "";

    console.log("prepared sub sections", preparedSectionWithSubSections)

    if (preparedSectionWithSubSections.sub_section_settings.display_section_title) {
        const titleToDisplay = preparedSectionWithSubSections.renamed_section_title || preparedSectionWithSubSections.title;
        const columnWidths = generateColumnFormatViaRatioArray([1]);
        const subHeaderRowData = [{
            textOptions: [textOptions(titleToDisplay, true, null)], // text, bold=true, size=null
            color: 'subHeaderGray'
        }];

        html += cellRowBuilder(subHeaderRowData, columnWidths);
    }

    const mappedSections = preparedSectionWithSubSections
        .sub_section_settings
        .sub_sections
        .map((subSection) => {

            const updatedAttributeGroups = preparedSectionWithSubSections.attribute_groups.map((attributeGroup) => {
                const attributesToHide = subSection.hidden_attributes_list || [];

                let updatedAttributeGroup = attributeGroup;

                if (attributeGroup.id !== HIDDEN_ATTRIBUTE_GROUP_ID) {
                    updatedAttributeGroup = {
                        ...attributeGroup,
                        attributes: attributeGroup.attributes.filter((attribute) => !attributesToHide.includes(attribute))
                    }
                }
                return updatedAttributeGroup;
            })

            const section = {
                ...preparedSectionWithSubSections,
                sub_section_settings: null,
                renamed_section_title: subSection.renamed_title || subSection.original_title,
                attribute_filter_value: subSection.original_title,
                attribute_rename_map: subSection.attributes_rename_dict,
                show_header: preparedSectionWithSubSections.sub_section_settings.display_titles,
                attribute_groups: updatedAttributeGroups,
                is_sub_section: true
            }
            console.log("section: ", section);
            return section;
        })

    console.log("mappedSections: ", mappedSections);

    for (const mappedSection of mappedSections) {
        html += buildPreparedSection(mappedSection, mappedSection.data_section_id);
    }
    return html;
}

const buildNotes = (preparedSection) => {
    if (!preparedSection.note_settings || preparedSection.note_settings.length === 0) {
        return "";
    }

    let html = "";
    const dataSectionId = preparedSection.data_section_id;
    const sectionData = getUserCvDataMap(dataSectionId);
    const filteredSectionData = filterDateRanges(sectionData, dataSectionId);
    const section = sectionsMap[dataSectionId];
    const sectionAttributes = JSON.parse(section.attributes);

    if (filteredSectionData.length === 0) {
        return "";
    }

    let preparedSectionsHtml = "";
    preparedSection.note_settings.forEach(noteSetting => {
        let preparedSectionHtml = "";
        filteredSectionData.forEach(data => {
            const attributeKey = sectionAttributes[noteSetting.attribute];
            const noteToShow = data.data_details[attributeKey];
            const attributeToAssociateWithNote = noteSetting.attribute_to_associate_note;

            if (!noteToShow || String(noteToShow).trim() === '') {
                return;
            }

            if (attributeToAssociateWithNote && attributeToAssociateWithNote.trim() !== '') {
                // Get the association value
                const associationKey = sectionAttributes[attributeToAssociateWithNote];
                const associationValue = data.data_details[associationKey];

                if (associationValue && associationValue.trim() !== '') {
                    preparedSectionHtml += `<div style="margin-left: 20pt;"><strong>${sanitizeRichText(associationValue)}</strong>:</div>\n`;
                    preparedSectionHtml += `<div style="margin-left: 40pt; background-color: #e9ecef; padding: 8px; border-radius: 4px; border: 1px solid #dee2e6; word-wrap: break-word; overflow-wrap: break-word; hyphens: auto; -webkit-hyphens: auto; -moz-hyphens: auto;">${sanitizeRichText(noteToShow)}</div>\n`;
                }
            } else {
                // Use bullet point format with background on the note content
                preparedSectionHtml += `<ul style="margin: 0; padding-left: 20px;">\n`;
                preparedSectionHtml += `<li><div style="background-color: #e9ecef; padding: 8px; border-radius: 4px; border: 1px solid #dee2e6; word-wrap: break-word; overflow-wrap: break-word; hyphens: auto; -webkit-hyphens: auto; -moz-hyphens: auto; margin-top: 4px;">${sanitizeRichText(String(noteToShow))}</div></li>\n`;
                preparedSectionHtml += `</ul>\n`;
            }
        });

        if (noteSetting.display_attribute_name && preparedSectionHtml.length > 0) {
            // Get the display name (check for rename first)
            const attributeRenameMap = preparedSection.attribute_rename_map || {};
            const displayName = attributeRenameMap[noteSetting.attribute] || noteSetting.attribute;
            preparedSectionsHtml = `\n<div style="text-decoration: underline; font-weight: bold;">${displayName}</div>\n` + preparedSectionHtml;
        }
    });

    if (preparedSectionsHtml.length > 0) {
        // Start a div with reduced line width (similar to LaTeX quote environment)
        html += `<div style="margin: 0 20px; padding: 10px 0;">\n`;
        // Add notes html
        html += preparedSectionsHtml;
        // End the div
        html += `</div>\n`;
    }

    return html;
};

// Also fix the typo in buildPreparedSection
const buildPreparedSection = (preparedSection, dataSectionId) => {
    let html = "";
    console.log(preparedSection);

    if (preparedSection.sub_section_settings && preparedSection.sub_section_settings.sub_sections.length > 0) {
        return buildSubSections(preparedSection);
    }

    if (!preparedSection.is_sub_section || (preparedSection.is_sub_section && preparedSection.show_header)) {
        html += buildTableSubHeader(preparedSection);
    }

    if (!preparedSection.merge_visible_attributes) {
        html += buildTableSectionColumns(preparedSection);
    }

    html += buildDataEntries(preparedSection, dataSectionId);

    html += buildNotes(preparedSection);

    return html;
}

const buildGroup = async (group) => {
    let html = "";

    html += buildTableHeader(group.title);

    for (const preparedSection of group.prepared_sections) {
        html += buildPreparedSection(preparedSection, preparedSection.data_section_id);
    }

    const verticalSpacing = `<div style="margin-top: 20pt;"></div>\n`;

    html += verticalSpacing;

    return html;
};

export const buildHtml = async (userInfoInput, templateWithEndStartDate) => {
    // Handle both single user and array of users
    const userInfoArray = Array.isArray(userInfoInput) ? userInfoInput : [userInfoInput];
    const isMultipleUsers = userInfoArray.length > 1;

    template = templateWithEndStartDate;
    sortAscending = JSON.parse(template.template_structure).sort_ascending;

    // Get all sections data once (shared for all users)
    const allSections = await getAllSections();
    const allSectionIds = allSections.map((section) => section.data_section_id);

    // Create sectionsMap with data_section_id as key and section as value
    sectionsMap = {};
    allSections.forEach((section) => {
        sectionsMap[section.data_section_id] = section;
    });

    // Start building the complete HTML document
    let completeHtml = buildHtmlHeader(isMultipleUsers);

    // Process each user
    for (let userIndex = 0; userIndex < userInfoArray.length; userIndex++) {
        const currentUserInfo = userInfoArray[userIndex];
        console.log(`Building CV for user ${userIndex + 1}/${userInfoArray.length}:`, currentUserInfo.first_name, currentUserInfo.last_name);

        // Add page break before each user (except the first one)
        if (isMultipleUsers && userIndex > 0) {
            completeHtml += addPageBreak();
        }

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

        // Create userCvDataMap with data_section_id as key and array of CV data as value
        userCvDataMap = {};
        userCvData.forEach((cvData) => {
            const sectionId = cvData.data_section_id;
            if (!userCvDataMap[sectionId]) {
                userCvDataMap[sectionId] = [];
            }
            userCvDataMap[sectionId].push(cvData);
        });

        // Build user profile section
        completeHtml += buildUserProfile(currentUserInfo);

        // Parse the template structure and process each group
        const parsedGroups = JSON.parse(template.template_structure).groups;

        for (const group of parsedGroups || []) {
            if (group.id === HIDDEN_GROUP_ID) continue; // Skip hidden groups
            completeHtml += await buildGroup(group);
        }

        console.log(`Completed CV for user ${userIndex + 1}/${userInfoArray.length}`);
    }

    // Close the HTML document
    completeHtml += buildHtmlFooter();

    console.log(`Built complete HTML document for ${userInfoArray.length} user(s)`);
    return completeHtml;
};

// Update buildHtmlHeader to include page break styles for multiple users
const buildHtmlHeader = (isMultipleUsers = false) => {
    const pageBreakStyles = isMultipleUsers ? `
        .page-break {
            page-break-before: always;
            -webkit-page-break-before: always;
            break-before: page;
        }
        .page-break-after {
            page-break-after: always;
            -webkit-page-break-after: always;
            break-after: page;
        }` : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Faculty CV</title>
    <style>
        @page {
            size: portrait;
            margin: 0.2in;
        }
        body {
            font-family: Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.2;
            margin: 0.2in;
            background-color: white;
            color: black;
        }
        @media print {
            @page {
                size: portrait;
                margin: 0.2in;
            }
            body {
                margin: 0.2in;
            }
            table {
                page-break-inside: auto;
                -webkit-page-break-inside: auto;
            }
            tr {
                page-break-inside: avoid;
                page-break-after: auto;
                -webkit-page-break-inside: avoid;
                -webkit-page-break-after: auto;
            }
            td {
                page-break-inside: avoid;
                -webkit-page-break-inside: avoid;
            }
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 0;
            padding: 0;
            border-spacing: 0;
            table-layout: fixed;
            page-break-inside: auto;
            -webkit-page-break-inside: auto;
        }
        tr {
            page-break-inside: avoid;
            page-break-after: auto;
            -webkit-page-break-inside: avoid;
            -webkit-page-break-after: auto;
        }
        td {
            padding: 2px 3px;
            border: 1px solid #000;
            vertical-align: top;
            word-wrap: break-word;
            hyphens: auto;
            -webkit-hyphens: auto;
            -moz-hyphens: auto;
            -ms-hyphens: auto;
            overflow-wrap: break-word;
            word-break: break-word;
            box-sizing: border-box;
            max-width: 0;
            min-width: 0;
            page-break-inside: avoid;
            -webkit-page-break-inside: avoid;
        }
        .header-gray {
            background-color: #999999;
        }
        .subheader-gray {
            background-color: #CCCCCC;
        }
        .column-gray {
            background-color: #F2F2F2;
        }
        .center {
            text-align: center;
        }
        .large {
            font-size: 14pt;
        }
        a {
            color: inherit;
            text-decoration: underline;
        }
        wbr {
            line-height: 0;
        }
        /* Force text wrapping and hyphenation */
        .force-wrap {
            word-break: break-all;
            overflow-wrap: break-word;
            hyphens: auto;
            -webkit-hyphens: auto;
            -moz-hyphens: auto;
            -ms-hyphens: auto;
        }
        /* Rich text formatting support */
        ol, ul {
            margin: 0.5em 0;
            padding-left: 1.5em;
        }
        li {
            margin: 0.2em 0;
        }
        sup, sub {
            font-size: 0.8em;
            line-height: 0;
        }
        s {
            text-decoration: line-through;
        }
        u {
            text-decoration: underline;
        }${pageBreakStyles}
    </style>
</head>
<body>`;
}

// Add helper function for page breaks
const addPageBreak = () => {
    return `<div class="page-break"></div>\n`;
}

// Add helper function for HTML footer
const buildHtmlFooter = () => {
    return `</body>\n</html>`;
}

export const buildUserProfile = (userInfoParam) => {
    // Get current date in format "Apr 11, 2025"
    userInfo = userInfoParam;

    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    // Parse joined timestamp to get rank start date
    const joinedDate = new Date(userInfo.joined_timestamp);
    const rankSinceDate = joinedDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: '2-digit'
    });

    // Extract middle name/initial from preferred_name
    const middleName = userInfo.preferred_name || "";

    // Build the profile table using existing functions
    let html = "";

    const startYear = template.start_year || 'All';
    const endYear = template.end_year || 'Present';
    const sortOrder = sortAscending ? 'Ascending' : 'Descending';
    const dateRangeText = `(${startYear} - ${endYear}, ${sortOrder})`;

    // Add title at the top
    html += `
    <div class="center">
        <div style="font-weight: bold;" class="large">University of British Columbia</div>
        <div style="font-weight: bold;">${template.title}</div>
        <div>${dateRangeText}</div>
    </div>
    <div style="margin-top: 20pt;"></div>
    `;

    // Date row
    const dateColumnWidths = generateColumnFormatViaRatioArray([1, 1]);
    const dateRowData = [
        {
            textOptions: [textOptions('Date:', true, null)], // text, bold=true, size=null
            color: null
        },
        {
            textOptions: [textOptions(currentDate, false, 9.5)], // text, bold=false, size='footnotesize'
            color: null
        }
    ];
    html += cellRowBuilder(dateRowData, dateColumnWidths);

    // Verification Initial row
    const verificationRowData = [
        {
            textOptions: [textOptions('Verification Initial:', true, null)],
            color: null
        },
        {
            textOptions: [textOptions('', false, null)],
            color: null
        }
    ];
    html += cellRowBuilder(verificationRowData, dateColumnWidths);

    // Name section
    const nameColumnWidths = generateColumnFormatViaRatioArray([3, 7]);

    // Surname row
    const surnameRowData = [
        {
            textOptions: [textOptions('1. SURNAME:', true, null)],
            color: null
        },
        {
            textOptions: [textOptions(userInfo.last_name || '', false, 9.5)],
            color: null
        }
    ];
    html += cellRowBuilder(surnameRowData, nameColumnWidths);

    // First name row
    const firstNameRowData = [
        {
            textOptions: [textOptions('FIRST NAME:', true, null)],
            color: null
        },
        {
            textOptions: [textOptions(userInfo.first_name || '', false, 9.5)],
            color: null
        }
    ];
    html += cellRowBuilder(firstNameRowData, nameColumnWidths);

    // Middle name row
    const middleNameRowData = [
        {
            textOptions: [textOptions('MIDDLE NAME:', true, null)],
            color: null
        },
        {
            textOptions: [textOptions(middleName || '', false, 9.5)],
            color: null
        }
    ];
    html += cellRowBuilder(middleNameRowData, nameColumnWidths);

    // Department section
    const departmentRowData = [
        {
            textOptions: [textOptions('2. DEPARTMENT/SCHOOL:', true, null)],
            color: null
        },
        {
            textOptions: [textOptions(userInfo.primary_department || '', false, 9.5)],
            color: null
        }
    ];
    html += cellRowBuilder(departmentRowData, nameColumnWidths);

    // Faculty section
    const facultyRowData = [
        {
            textOptions: [textOptions('3. FACULTY:', true, 9.5)],
            color: null
        },
        {
            textOptions: [textOptions(userInfo.primary_faculty || '', false, 9.5)],
            color: null
        }
    ];
    html += cellRowBuilder(facultyRowData, nameColumnWidths);

    // Present rank row
    const rankRowData = [
        {
            textOptions: [textOptions('4. PRESENT RANK:', true, 9.5)],
            color: null
        },
        {
            textOptions: [textOptions(userInfo.rank || '', false, 9.5)],
            color: null
        }
    ];
    html += cellRowBuilder(rankRowData, nameColumnWidths);

    // Since row
    const sinceRowData = [
        {
            textOptions: [textOptions('SINCE:', true, null)],
            color: null
        },
        {
            textOptions: [textOptions(rankSinceDate, false, 9.5)],
            color: null
        }
    ];
    html += cellRowBuilder(sinceRowData, nameColumnWidths);

    const verticalSpacing = `<div style="margin-top: 20pt;"></div>\n`;

    html += verticalSpacing;

    return html;
};
