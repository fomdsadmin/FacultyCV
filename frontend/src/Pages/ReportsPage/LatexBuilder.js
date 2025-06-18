import { getAllSections, getUserCVData, getLatexConfiguration } from '../../graphql/graphqlHelpers.js';
import { SHOWN_ATTRIBUTE_GROUP_ID, HIDDEN_ATTRIBUTE_GROUP_ID } from '../TemplatePages/SharedTemplatePageComponents/TemplateModifier/TemplateModifierContext.jsx'

let userCvData = [];
let allSections = [];
const rowNumberColumnRatio = 3;

const sanitizeLatex = (text) => {
    if (typeof text !== 'string') return text; // Return as-is if not a string

    // Replace special LaTeX characters with their escaped versions using String.raw
    return String.raw`${text
        .replace(/\\/g, '\\textbackslash{}') // Backslash
        .replace(/{/g, '\\{')               // Left curly brace
        .replace(/}/g, '\\}')               // Right curly brace
        .replace(/\$/g, '\\$')              // Dollar sign
        .replace(/&/g, '\\&')               // Ampersand
        .replace(/%/g, '\\%')               // Percent sign
        .replace(/#/g, '\\#')               // Hash
        .replace(/_/g, '\\_')               // Underscore
        .replace(/\^/g, '\\textasciicircum{}') // Caret
        .replace(/~/g, '\\textasciitilde{}')  // Tilde
        }`;
};

const addAllowBreaks = (text) => {
    if (typeof text !== 'string') return text; // Return as-is if not a string

    // Replace specific characters with their LaTeX \allowbreak equivalents
    return String.raw`${text}`
        .replace(/,/g, ',\\hspace{0pt}')   // Comma
        .replace(/\./g, '.\\hspace{0pt}') // Period
        .replace(/-/g, '-\\hspace{0pt}')  // Hyphen
        .replace(/\//g, '/\\hspace{0pt}') // Forward slash
        .replace(/:/g, ':\\hspace{0pt}') // Colon
        .replace(/;/g, ';\\hspace{0pt}') // Semicolon
        .replace(/_/g, '_\\hspace{0pt}') // Underscore
        .replace(/=/g, '=\\hspace{0pt}') // Equal
        .replace(/&/g, '&\\hspace{0pt}') // Ampersand
        .replace(/\?/g, '?\\hspace{0pt}') // Question mark
        .replace(/(?<!\\hspace\{[^}]*)\d(?!pt)/g, '$&\\hspace{0pt}'); // Digit not in \hspace{}
};

const buildTableHeader = (title) => {
    const header = String.raw`
    \begin{tabular}{${generateColumnFormatViaRatioArray([1])}}
    \hline
    \rowcolor{headerGray}
    \textbf{${title}} \\
    \hline
    \end{tabular}%
    \vspace{-1pt}
    `

    return header;
}

const buildTableSubHeader = (preparedSection) => {

    let titleToDisplay = preparedSection.renamed_section_title || preparedSection.title;

    if (preparedSection.show_row_count) {
        const rowCount = userCvData.filter((cvData) => cvData.data_section_id === preparedSection.data_section_id).length;
        titleToDisplay += ` (${rowCount})`
    }

    const subHeader = String.raw`
    \begin{tabular}{${generateColumnFormatViaRatioArray([1])}}
    \hline
    \rowcolor{subHeaderGray}
    \textbf{${titleToDisplay}} \\
    \hline
    \end{tabular}%
    \vspace{-1pt}
    `

    return subHeader;
}

const buildDataEntries = (preparedSection, dataSectionId) => {

    const attributeGroups = preparedSection.attribute_groups;

    const displayedAttributeGroups = attributeGroups.filter((attributeGroup) => attributeGroup.id !== HIDDEN_ATTRIBUTE_GROUP_ID);

    const attributes = displayedAttributeGroups.flatMap((attributeGroup) => attributeGroup.attributes);

    // Filter userCvData by the given dataSectionId
    const sectionData = userCvData.filter((cvData) => cvData.data_section_id === dataSectionId);

    var latexTables;

    // Generate LaTeX tables for each entry
    latexTables = sectionData.map((data, rowCount) => {
        // Map attributes to their corresponding values in data_details
        const section = allSections.find((section) => section.data_section_id === dataSectionId);
        var rowArray = attributes.map((attribute) => {
            // Some data is an array for some reason
            const tabData = String(data.data_details[JSON.parse(section.attributes)[attribute]]);
            console.log('Original tabData:', tabData);
            console.log('After sanitizeLatex:', sanitizeLatex(tabData));
            console.log('After addAllowBreaks:', addAllowBreaks(sanitizeLatex(tabData)));

            if (!preparedSection.merge_visible_attributes) {
                return String.raw`{\footnotesize ${addAllowBreaks(sanitizeLatex(tabData))}}`;
            } else {
                return tabData;
            }
        });

        if (preparedSection.merge_visible_attributes) {
            rowArray = [String.raw`{\footnotesize ${addAllowBreaks(sanitizeLatex(rowArray.join(`, `)))}}`]
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

            dataColumnFormat = generateColumnFormatViaRatioArray(ratioArray)
            rowArray.unshift(rowCount + 1);
        }

        // Wrap the row in its own tabularx environment
        console.log(
            String.raw`
            \begin{tabular}{${dataColumnFormat}}
            \hline
            ${rowArray.join(' & ')} \\
            \hline
            \end{tabular}%
            \vspace{-1pt}
            `
        )
        return String.raw`
            \begin{tabular}{${dataColumnFormat}}
            \hline
            ${rowArray.join(' & ')} \\
            \hline
            \end{tabular}%
            \vspace{-1pt}
            `;
    });

    // Join all individual tables
    return latexTables.join('\n');
}

const buildTableAttributeGroup = (attributeGroups) => {

    const columnRatioArray = [];
    let groupedColumnNamesArray = [];
    for (const attributeGroup of attributeGroups.filter((attributeGroup) => attributeGroup.id !== HIDDEN_ATTRIBUTE_GROUP_ID)) {
        if (attributeGroup.id !== SHOWN_ATTRIBUTE_GROUP_ID) {
            groupedColumnNamesArray.push(String.raw`\textbf{${attributeGroup.title}}`)
        } else {
            groupedColumnNamesArray.push(String.raw`\textbf{~}`);
        }
        var ratio = 0;
        for (const attribute of attributeGroup.attributes) {
            ratio += 1;
        }
        columnRatioArray.push(ratio);
    }

    const columnFormat = generateColumnFormatViaRatioArray(columnRatioArray);

    const groupedColumnHeader = String.raw`
    \begin{tabular}{${columnFormat}}
    \hline
    \rowcolor{columnGray}
    ${groupedColumnNamesArray.join(' & ')}
    \end{tabular}%
    \vspace{-1pt}
    `

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

    // Dynamically create the header row based on the attribute names
    const headerRow = attributes
        .map((attribute) => `\\textbf{${attributeRenameMap[attribute] || attribute}}`)
        .join(' & ');

    // Start building the LaTeX table
    latex += String.raw`
    \begin{tabular}{${columnFormat}}
    \hline
    \rowcolor{columnGray}
    ${headerRow} \\
    \hline
    \end{tabular}%
    \vspace{-1pt}
    `;

    return latex;
}

const buildPreparedSection = (preparedSection, dataSectionId) => {
    let latex = "";

    latex += buildTableSubHeader(preparedSection);

    if (!preparedSection.merge_visible_attributes) {
        latex += buildTableSectionColumns(preparedSection, dataSectionId);
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

const generateColumnFormatViaRatioArray = (ratioArray) => {
    const totalRatio = ratioArray.reduce((sum, ratio) => sum + ratio, 0);
    const lineWidthRatio = 0.95;
    const numColumns = ratioArray.length;
    const numVerticalLines = numColumns + 1; // Lines between columns + 2 outer lines

    // Each vertical line is approximately 0.4pt ≈ 0.014cm
    const verticalLineWidth = `${numVerticalLines * 0.4}pt`;

    const columnFormat = ratioArray
        .map((ratio) => {
            const widthRatio = (ratio / totalRatio).toFixed(4);
            const ratioToUse = lineWidthRatio * widthRatio;
            return `>{\\raggedright\\arraybackslash}p{\\dimexpr${ratioToUse}\\linewidth-2\\tabcolsep-${verticalLineWidth}/${numColumns}\\relax}`;
        })
        .join('|');

    return `|${columnFormat}|`;
};

export const buildLatex = async (userInfo, template) => {
    const latexConfiguration = JSON.parse(await getLatexConfiguration());
    let latex = buildLatexHeader(userInfo, latexConfiguration);

    // Get all user data
    allSections = await getAllSections();
    const allSectionIds = allSections.map((section) => section.data_section_id);
    const unparsedData = await getUserCVData(userInfo.user_id, allSectionIds);

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
    const parsedGroups = JSON.parse(template.template_structure);

    // Process each group in the template
    for (const group of parsedGroups || []) {
        if (group.id === 'HIDDEN_GROUP_ID') continue; // Skip hidden groups
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