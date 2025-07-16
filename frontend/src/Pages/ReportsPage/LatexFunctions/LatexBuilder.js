import { getAllSections, getUserCVData, getLatexConfiguration } from '../../../graphql/graphqlHelpers.js';
import { SHOWN_ATTRIBUTE_GROUP_ID, HIDDEN_ATTRIBUTE_GROUP_ID, HIDDEN_GROUP_ID } from '../../TemplatePages/SharedTemplatePageComponents/TemplateModifier/TemplateModifierContext.jsx'
import { cellRowBuilder, generateColumnFormatViaRatioArray, sanitizeLatex, textOptions } from './LatexTableBuilder.js';

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
    const columnFormat = generateColumnFormatViaRatioArray([1]);
    const headerRowData = [{
        textOptions: [textOptions(title, true, null)], // text, bold=true, size=null
        color: 'headerGray'
    }];

    return cellRowBuilder(headerRowData, columnFormat);
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

    const columnFormat = generateColumnFormatViaRatioArray([1]);
    const subHeaderRowData = [{
        textOptions: [textOptions(titleToDisplay, true, null)], // text, bold=true, size=null
        color: 'subHeaderGray'
    }];

    return cellRowBuilder(subHeaderRowData, columnFormat);
}

const sortSectionData = (sectionData, dataSectionId) => {
    // Find the section to get the attribute mapping
    const section = sectionsMap[dataSectionId];
    if (!section) {
        console.warn(`Section not found for dataSectionId: ${dataSectionId}`);
        return sectionData;
    }

    const attributeMapping = JSON.parse(section.attributes);

    // Look for date-related attributes (year or date)
    const yearAttribute = attributeMapping['Year'] || attributeMapping['Year Published'];
    const dateAttribute = attributeMapping['Date'];

    // If no date attributes found, return unsorted data
    if (!yearAttribute && !dateAttribute) {
        return sectionData;
    }

    return sectionData.sort((a, b) => {
        let endYearA = null;
        let endYearB = null;

        // Try to extract end year from year attribute first
        if (yearAttribute) {
            if (a.data_details[yearAttribute]) {
                const yearValueA = String(a.data_details[yearAttribute]);
                const yearMatchA = yearValueA.match(/\d{4}/g);
                if (yearMatchA) {
                    endYearA = parseInt(yearMatchA[yearMatchA.length - 1]);
                }
            }

            if (b.data_details[yearAttribute]) {
                const yearValueB = String(b.data_details[yearAttribute]);
                const yearMatchB = yearValueB.match(/\d{4}/g);
                if (yearMatchB) {
                    endYearB = parseInt(yearMatchB[yearMatchB.length - 1]);
                }
            }
        }

        // If no year found, try to extract from date attribute
        if (!endYearA && dateAttribute && a.data_details[dateAttribute]) {
            const dateValueA = String(a.data_details[dateAttribute]);
            endYearA = extractEndYearFromDateRange(dateValueA);
        }

        if (!endYearB && dateAttribute && b.data_details[dateAttribute]) {
            const dateValueB = String(b.data_details[dateAttribute]);
            endYearB = extractEndYearFromDateRange(dateValueB);
        }

        // Handle cases where we couldn't extract years
        // Items without dates go to the end
        if (!endYearA && !endYearB) return 0;
        if (!endYearA) return 1;
        if (!endYearB) return -1;

        // Sort by year
        const comparison = endYearA - endYearB;

        // Apply ascending/descending order based on sortAscending
        return sortAscending ? comparison : -comparison;
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
            const indexOfThisAuthor = authorIds.indexOf(userInfo.scopus_id);

            // Check if authorNames is an array before mapping
            if (!Array.isArray(authorNames)) {
                console.warn('authorNames is not an array:', authorNames);
                return {
                    textOptions: [textOptions(String(authorNames), false, 9.5)],
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
        const tabData = data.data_details[sectionAttributes[attribute]];
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
        const tabData = data.data_details[sectionAttributes[attribute]];
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

// Generate column format based on merge and row number options
const generateDataColumnFormat = (attributes, preparedSection) => {
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

// Main buildDataEntries function - now much cleaner
const buildDataEntries = (preparedSection, dataSectionId) => {
    const PUBLICATION_SECTION_ID = "1c23b9a0-b6b5-40b8-a4aa-f822d0567f09";
    const RESEARCH_OR_EQUIVALENT_GRANTS_AND_CONTRACTS_ID = "";

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

    // Generate LaTeX tables for each entry
    const latexTables = sectionData.map((data, rowCount) => {
        const section = sectionsMap[dataSectionId];

        // Build row array based on section type
        let rowArray;
        if (section.data_section_id === PUBLICATION_SECTION_ID) {
            rowArray = buildPublicationRowArray(data, attributes, section);
        } else {
            rowArray = buildRegularRowArray(data, attributes, section);
        }

        // Add row number column if needed
        if (preparedSection.include_row_number_column) {
            rowArray = addRowNumberColumn(rowArray, rowCount);
        }

        // Generate column format
        const dataColumnFormat = generateDataColumnFormat(attributes, preparedSection);

        // Use cellRowBuilder with mergeCells option
        return cellRowBuilder(
            rowArray,
            dataColumnFormat,
            preparedSection.merge_visible_attributes,
            !preparedSection.include_row_number_column
        );
    });

    // Join all individual tables
    return latexTables.join('\n');
}

const buildTableAttributeGroup = (attributeGroups) => {
    const columnRatioArray = [];
    let groupedColumnNamesArray = [];

    for (const attributeGroup of attributeGroups.filter((attributeGroup) => attributeGroup.id !== HIDDEN_ATTRIBUTE_GROUP_ID)) {
        const title = attributeGroup.id !== SHOWN_ATTRIBUTE_GROUP_ID ? attributeGroup.title : '~';

        // Create the cell object in the format cellRowBuilder expects
        const cellObject = {
            textOptions: [textOptions(title, true, 11)], // text, bold=true, size='small'
            color: 'columnGray'
        };

        groupedColumnNamesArray.push(cellObject);

        var ratio = 0;
        for (const attribute of attributeGroup.attributes) {
            ratio += 1;
        }
        columnRatioArray.push(ratio);
    }

    const columnFormat = generateColumnFormatViaRatioArray(columnRatioArray);
    const groupedColumnHeader = cellRowBuilder(groupedColumnNamesArray, columnFormat);

    return groupedColumnHeader;
}

const buildTableSectionColumns = (preparedSection) => {
    let latex = "";

    const attributeGroups = preparedSection.attribute_groups;
    const attributeRenameMap = preparedSection.attribute_rename_map;

    // take into account hidden and shown attribute group
    if (attributeGroups.length > 2) {
        latex += buildTableAttributeGroup(attributeGroups);
    }

    const displayedAttributeGroups = attributeGroups.filter((attributeGroup) => attributeGroup.id !== HIDDEN_ATTRIBUTE_GROUP_ID);
    const attributes = displayedAttributeGroups.flatMap((attributeGroup) => attributeGroup.attributes);

    var columnFormat;
    if (!preparedSection.include_row_number_column) {
        // Dynamically create the column format string based on the number of attributes
        columnFormat = generateColumnFormatViaRatioArray(attributes.map(() => 1));
    } else {
        const customAttributeRatio = attributes.map(() => rowNumberColumnRatio);
        customAttributeRatio.unshift(1);
        columnFormat = generateColumnFormatViaRatioArray(customAttributeRatio);
        attributes.unshift("Row #");
    }

    // Create header row data using textOptions format
    const headerRowData = attributes.map((attribute) => ({
        textOptions: [textOptions(attributeRenameMap[attribute] || attribute, true, null)], // text, bold=true, size=null
        color: 'columnGray'
    }));

    latex += cellRowBuilder(headerRowData, columnFormat);

    return latex;
}

const buildSubSections = (preparedSectionWithSubSections) => {

    let latex = "";

    console.log("prepared sub sections", preparedSectionWithSubSections)

    if (preparedSectionWithSubSections.sub_section_settings.display_section_title) {
        const titleToDisplay = preparedSectionWithSubSections.renamed_section_title || preparedSectionWithSubSections.title;
        const columnFormat = generateColumnFormatViaRatioArray([1]);
        const subHeaderRowData = [{
            textOptions: [textOptions(titleToDisplay, true, null)], // text, bold=true, size=null
            color: 'subHeaderGray'
        }];

        latex += cellRowBuilder(subHeaderRowData, columnFormat);
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
        latex += buildPreparedSection(mappedSection, mappedSection.data_section_id);
    }
    return latex;
}

const buildNotes = (preparedSection) => {

    if (!preparedSection.note_settings || preparedSection.note_settings.length === 0) {
        return "";
    }

    let latex = "";
    const dataSectionId = preparedSection.data_section_id;
    const sectionData = getUserCvDataMap(dataSectionId);
    const filteredSectionData = filterDateRanges(sectionData, dataSectionId);
    const section = sectionsMap[dataSectionId];
    const sectionAttributes = JSON.parse(section.attributes);

    if (filteredSectionData.length === 0) {
        return "";
    }

    let preparedSectionsLatex = "";
    preparedSection.note_settings.forEach(noteSetting => {
        let preparedSectionLatex = "";
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
                    preparedSectionLatex += String.raw`\hspace{20pt}\textbf{${sanitizeLatex(associationValue)}}` + ': ' + sanitizeLatex(noteToShow) + '\n\n';
                }
            } else {
                // Use bullet point format
                preparedSectionLatex += String.raw`\begin{itemize}` + '\n';
                preparedSectionLatex += String.raw`\item ` + sanitizeLatex(String(noteToShow)) + '\n';
                preparedSectionLatex += String.raw`\end{itemize}` + '\n';
            }
        });

        if (noteSetting.display_attribute_name && preparedSectionLatex.length > 0) {
            // Get the display name (check for rename first)
            const attributeRenameMap = preparedSection.attribute_rename_map || {};
            const displayName = attributeRenameMap[noteSetting.attribute] || noteSetting.attribute;
            preparedSectionsLatex = '\n\n' + String.raw`\underline{\textbf{` + displayName + String.raw`}}` + '\n\n' + preparedSectionLatex;
        }
    });

    if (preparedSectionsLatex.length > 0) {
        // Start a paragraph with reduced line width
        latex += String.raw`\begin{quote}` + '\n';
        // Add notes latex
        latex += preparedSectionsLatex;
        // End the quote environment
        latex += String.raw`\end{quote}` + '\n';
    }

    return latex;
};

// Also fix the typo in buildPreparedSection
const buildPreparedSection = (preparedSection, dataSectionId) => {
    let latex = "";
    console.log(preparedSection);

    if (preparedSection.sub_section_settings && preparedSection.sub_section_settings.sub_sections.length > 0) {
        return buildSubSections(preparedSection);
    }

    if (!preparedSection.is_sub_section || (preparedSection.is_sub_section && preparedSection.show_header)) {
        latex += buildTableSubHeader(preparedSection);
    }

    if (!preparedSection.merge_visible_attributes) {
        latex += buildTableSectionColumns(preparedSection);
    }

    latex += buildDataEntries(preparedSection, dataSectionId);

    latex += buildNotes(preparedSection);

    return latex;
}

const buildGroup = async (group) => {
    //console.log(group)
    let latex = "";

    latex += buildTableHeader(group.title);

    for (const preparedSection of group.prepared_sections) {
        latex += buildPreparedSection(preparedSection, preparedSection.data_section_id);
    }

    const verticalSpacing = String.raw`
    \vspace*{20pt}
    \noindent
    `

    latex += verticalSpacing;

    return latex;
};

const buildLatexHeader = () => {
    let latex = String.raw`
    \documentclass[11pt]{article}
    `

    const packages = String.raw`
    \usepackage[margin=0.2in]{geometry}
    \usepackage{tabularx}
    \usepackage{colortbl}
    \usepackage{array}
    \usepackage{hyperref}
    \hyphenpenalty=10000
    \exhyphenpenalty=10000
    `

    latex += packages;

    const colours = String.raw`
    \definecolor{columnGray}{gray}{0.95}
    \definecolor{headerGray}{gray}{0.6}
    \definecolor{subHeaderGray}{gray}{0.8}
    `

    latex += colours;

    const documentStart = String.raw`
    \newcolumntype{Y}{>{\RaggedRight\arraybackslash}X}
    \begin{document}
    `

    latex += documentStart

    return latex;
}

export const buildLatex = async (userInfo, templateWithEndStartDate) => {

    //console.log(templateWithEndStartDate.start_year, templateWithEndStartDate.end_year);

    //const latexConfiguration = JSON.parse(await getLatexConfiguration());

    // Get all user data
    const allSections = await getAllSections();
    template = templateWithEndStartDate;
    const allSectionIds = allSections.map((section) => section.data_section_id);
    const unparsedData = await getUserCVData(userInfo.user_id, allSectionIds);
    sortAscending = JSON.parse(template.template_structure).sort_ascending;

    // Create sectionsMap with data_section_id as key and section as value
    sectionsMap = {};
    allSections.forEach((section) => {
        sectionsMap[section.data_section_id] = section;
    });

    let latex = buildLatexHeader();

    latex += buildUserProfile(userInfo);

    //console.log("UserInfo", userInfo);

    // Parse user data and create userCvDataMap
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

    //console.log(userCvData)

    // Parse the template structure
    const parsedGroups = JSON.parse(template.template_structure).groups;

    // Process each group in the template
    for (const group of parsedGroups || []) {
        if (group.id === HIDDEN_GROUP_ID) continue; // Skip hidden groups
        //console.log(group)
        latex += await buildGroup(group);
    }

    const documentEnd = String.raw`
    \end{document}
    `

    latex += documentEnd;

    console.log(latex);
    return latex;
};

const buildUserProfile = (userInfoParam) => {
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
    let latex = "";

    const startYear = template.start_year || 'All';
    const endYear = template.end_year || 'Present';
    const sortOrder = sortAscending ? 'Ascending' : 'Descending';
    const dateRangeText = `(${startYear} - ${endYear}, ${sortOrder})`;

    // Add title at the top
    latex += String.raw`
    \begin{center}
    \textbf{\large University of British Columbia} \\
    \textbf{${template.title}} \\
    ${dateRangeText}
    \end{center}
    \vspace{20pt}
    `;

    // Date row
    const dateColumnFormat = generateColumnFormatViaRatioArray([1, 1]);
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
    latex += cellRowBuilder(dateRowData, dateColumnFormat);

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
    latex += cellRowBuilder(verificationRowData, dateColumnFormat);

    // Name section
    const nameColumnFormat = generateColumnFormatViaRatioArray([3, 7]);

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
    latex += cellRowBuilder(surnameRowData, nameColumnFormat);

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
    latex += cellRowBuilder(firstNameRowData, nameColumnFormat);

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
    latex += cellRowBuilder(middleNameRowData, nameColumnFormat);

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
    latex += cellRowBuilder(departmentRowData, nameColumnFormat);

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
    latex += cellRowBuilder(facultyRowData, nameColumnFormat);

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
    latex += cellRowBuilder(rankRowData, nameColumnFormat);

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
    latex += cellRowBuilder(sinceRowData, nameColumnFormat);

    const verticalSpacing = String.raw`
    \vspace*{20pt}
    \noindent
    `

    latex += verticalSpacing;

    return latex;
};