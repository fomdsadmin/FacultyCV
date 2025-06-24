import { getAllSections, getUserCVData, getLatexConfiguration } from '../../../graphql/graphqlHelpers.js';
import { SHOWN_ATTRIBUTE_GROUP_ID, HIDDEN_ATTRIBUTE_GROUP_ID, HIDDEN_GROUP_ID } from '../../TemplatePages/SharedTemplatePageComponents/TemplateModifier/TemplateModifierContext.jsx'
import { cellOptionsBuilder, cellRowBuilder, generateColumnFormatViaRatioArray } from './LatexTableBuilder.js';

let userCvData = [];
let allSections = [];
const rowNumberColumnRatio = 3;
let template = {};
let sortAscending;

const buildTableHeader = (title) => {
    const columnFormat = generateColumnFormatViaRatioArray([1]);
    const headerRowData = [cellOptionsBuilder(
        title,
        true,         // bold
        null,         // default size
        'headerGray'  // background color
    )];

    return cellRowBuilder(headerRowData, columnFormat);
}

const buildTableSubHeader = (preparedSection) => {
    let titleToDisplay = preparedSection.renamed_section_title || preparedSection.title;

    if (preparedSection.show_row_count) {
        let sectionData = userCvData.filter((cvData) => cvData.data_section_id === preparedSection.data_section_id);

        // Apply date range filtering
        sectionData = filterDateRanges(sectionData, preparedSection.data_section_id);
        const rowCount = sectionData.length;
        titleToDisplay += ` (${rowCount})`
    }

    const columnFormat = generateColumnFormatViaRatioArray([1]);
    const subHeaderRowData = [cellOptionsBuilder(
        titleToDisplay,
        true,            // bold
        null,            // default size
        'subHeaderGray'  // background color
    )];

    return cellRowBuilder(subHeaderRowData, columnFormat);
}

const sortSectionData = (sectionData, dataSectionId) => {
    // Find the section to get the attribute mapping
    const section = allSections.find((section) => section.data_section_id === dataSectionId);
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
    // If no template date range is specified, return all data
    if (!template.start_year && !template.end_year) {
        return sectionData;
    }

    // Find the section to get attribute mappings
    const section = allSections.find((section) => section.data_section_id === dataSectionId);
    if (!section) {
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
    if (dateString.toLowerCase().includes('current') ||
        dateString.toLowerCase().includes('present') ||
        dateString.toLowerCase().includes('ongoing')) {
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

const buildDataEntries = (preparedSection, dataSectionId) => {
    const attributeGroups = preparedSection.attribute_groups;
    const displayedAttributeGroups = attributeGroups.filter((attributeGroup) => attributeGroup.id !== HIDDEN_ATTRIBUTE_GROUP_ID);
    const attributes = displayedAttributeGroups.flatMap((attributeGroup) => attributeGroup.attributes);

    // Filter userCvData by the given dataSectionId
    let sectionData = userCvData.filter((cvData) => cvData.data_section_id === dataSectionId);

    // Apply date range filtering
    sectionData = filterDateRanges(sectionData, dataSectionId);

    // Apply sorting
    sectionData = sortSectionData(sectionData, dataSectionId);

    // Generate LaTeX tables for each entry
    const latexTables = sectionData.map((data, rowCount) => {
        // Map attributes to their corresponding values in data_details
        const section = allSections.find((section) => section.data_section_id === dataSectionId);

        let rowArray = attributes.map((attribute) => {
            // Some data is an array for some reason
            const tabData = String(data.data_details[JSON.parse(section.attributes)[attribute]]);

            if (!preparedSection.merge_visible_attributes) {
                return cellOptionsBuilder(
                    tabData,
                    false,        // not bold
                    'footnotesize', // small size
                    null          // no background color
                );
            } else {
                return tabData;
            }
        });

        if (preparedSection.merge_visible_attributes) {
            const mergedText = rowArray.join(`, `);
            rowArray = [cellOptionsBuilder(
                mergedText,
                false,        // not bold
                'footnotesize', // small size
                null          // no background color
            )];
        }

        var dataColumnFormat;

        if (!preparedSection.include_row_number_column) {
            dataColumnFormat = generateColumnFormatViaRatioArray(attributes.map(() => 1))
        } else {
            var ratioArray;

            if (!preparedSection.merge_visible_attributes) {
                ratioArray = attributes.map(() => rowNumberColumnRatio);
                ratioArray.unshift(1);
            } else {
                ratioArray = [1, 18];
            }

            dataColumnFormat = generateColumnFormatViaRatioArray(ratioArray);

            // Add row number as first cell
            rowArray.unshift(cellOptionsBuilder(
                String(rowCount + 1),
                false,        // not bold
                'footnotesize', // small size
                null          // no background color
            ));
        }

        // Use cellRowBuilder to generate the table
        return cellRowBuilder(rowArray, dataColumnFormat);
    });

    // Join all individual tables
    return latexTables.join('\n');
}

const buildTableAttributeGroup = (attributeGroups) => {

    const columnRatioArray = [];
    let groupedColumnNamesArray = [];
    for (const attributeGroup of attributeGroups.filter((attributeGroup) => attributeGroup.id !== HIDDEN_ATTRIBUTE_GROUP_ID)) {
        if (attributeGroup.id !== SHOWN_ATTRIBUTE_GROUP_ID) {
            groupedColumnNamesArray.push(cellOptionsBuilder(attributeGroup.title, true, 'small', 'columnGray'))
        } else {
            groupedColumnNamesArray.push(cellOptionsBuilder('~', true, 'small', 'columnGray'))
        }
        var ratio = 0;
        for (const attribute of attributeGroup.attributes) {
            ratio += 1;
        }
        columnRatioArray.push(ratio);
    }

    const columnFormat = generateColumnFormatViaRatioArray(columnRatioArray);

    const groupedColumnHeader = cellRowBuilder(groupedColumnNamesArray, columnFormat)

    return groupedColumnHeader
}

const buildTableSectionColumns = (preparedSection) => {
    let latex = "";

    const attributeGroups = preparedSection.attribute_groups;
    const attributeRenameMap = preparedSection.attribute_rename_map;

    // take into account hidden and shown attribute group
    if (attributeGroups.length > 2) {
        latex += buildTableAttributeGroup(attributeGroups);
    }

    // Find the attribute group with the SHOWN_ATTRIBUTE_GROUP_ID
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

    // Create header row data using cellOptionsBuilder
    const headerRowData = attributes.map((attribute) =>
        cellOptionsBuilder(
            attributeRenameMap[attribute] || attribute,
            true,        // bold
            null,        // size
            'columnGray' // background color
        )
    );

    // Build the header row using cellRowBuilder
    latex += cellRowBuilder(headerRowData, columnFormat);

    return latex;
}

const buildPreparedSection = (preparedSection, dataSectionId) => {
    let latex = "";

    latex += buildTableSubHeader(preparedSection);

    if (!preparedSection.merge_visible_attributes) {
        latex += buildTableSectionColumns(preparedSection);
    }

    latex += buildDataEntries(preparedSection, dataSectionId);

    return latex;
}

const buildGroup = async (group) => {
    console.log(group)
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

    console.log(templateWithEndStartDate.start_year, templateWithEndStartDate.end_year);

    //const latexConfiguration = JSON.parse(await getLatexConfiguration());

    // Get all user data
    allSections = await getAllSections();
    template = templateWithEndStartDate;
    const allSectionIds = allSections.map((section) => section.data_section_id);
    const unparsedData = await getUserCVData(userInfo.user_id, allSectionIds);

    let latex = buildLatexHeader();

    latex += buildUserProfile(userInfo);

    console.log(userInfo);

    // Parse user data
    userCvData = unparsedData.map((data) => {
        let dataDetails;
        try {
            dataDetails = JSON.parse(data.data_details);
        } catch (e) {
            dataDetails = data.data_details;
        }
        return { ...data, data_details: dataDetails };
    });

    console.log(userCvData)

    // Parse the template structure
    const parsedGroups = JSON.parse(template.template_structure).groups;
    sortAscending = JSON.parse(template.template_structure).sort_ascending;

    // Process each group in the template
    for (const group of parsedGroups || []) {
        if (group.id === HIDDEN_GROUP_ID) continue; // Skip hidden groups
        console.log(group)
        latex += await buildGroup(group);
    }

    const documentEnd = String.raw`
    \end{document}
    `

    latex += documentEnd;

    console.log(latex);
    return latex;
};

const buildUserProfile = (userInfo) => {
    // Get current date in format "Apr 11, 2025"
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
        cellOptionsBuilder('Date:', true, null, null),
        cellOptionsBuilder(currentDate, false, 'footnotesize', null)
    ];
    latex += cellRowBuilder(dateRowData, dateColumnFormat);

    // Verification Initial row
    const verificationRowData = [
        cellOptionsBuilder('Verification Initial:', true, null, null),
        cellOptionsBuilder('', false, null, null)
    ];
    latex += cellRowBuilder(verificationRowData, dateColumnFormat);

    // Name section
    const nameColumnFormat = generateColumnFormatViaRatioArray([3, 7]);

    // Surname row
    const surnameRowData = [
        cellOptionsBuilder('1. SURNAME:', true, null, null),
        cellOptionsBuilder(userInfo.last_name || '', false, 'footnotesize', null)
    ];
    latex += cellRowBuilder(surnameRowData, nameColumnFormat);

    // First name row
    const firstNameRowData = [
        cellOptionsBuilder('FIRST NAME:', true, null, null),
        cellOptionsBuilder(userInfo.first_name || '', false, 'footnotesize', null)
    ];
    latex += cellRowBuilder(firstNameRowData, nameColumnFormat);

    // Middle name row
    const middleNameRowData = [
        cellOptionsBuilder('MIDDLE NAME:', true, null, null),
        cellOptionsBuilder(middleName, false, 'footnotesize', null)
    ];
    latex += cellRowBuilder(middleNameRowData, nameColumnFormat);

    // Department section
    const departmentRowData = [
        cellOptionsBuilder('2. DEPARTMENT/SCHOOL:', true, null, null),
        cellOptionsBuilder(userInfo.primary_department || '', false, 'footnotesize', null)
    ];
    latex += cellRowBuilder(departmentRowData, nameColumnFormat);

    // Faculty section
    const facultyRowData = [
        cellOptionsBuilder('3. FACULTY:', true, null, null),
        cellOptionsBuilder(userInfo.primary_faculty || '', false, 'footnotesize', null)
    ];
    latex += cellRowBuilder(facultyRowData, nameColumnFormat);

    // Present rank row
    const rankRowData = [
        cellOptionsBuilder('4. PRESENT RANK:', true, null, null),
        cellOptionsBuilder(userInfo.rank || '', false, 'footnotesize', null)
    ];
    latex += cellRowBuilder(rankRowData, nameColumnFormat);

    // Since row
    const sinceRowData = [
        cellOptionsBuilder('SINCE:', true, null, null),
        cellOptionsBuilder(rankSinceDate, false, 'footnotesize', null)
    ];
    latex += cellRowBuilder(sinceRowData, nameColumnFormat);


    const verticalSpacing = String.raw`
    \vspace*{20pt}
    \noindent
    `

    // Add final spacing
    latex += verticalSpacing;

    return latex;
};