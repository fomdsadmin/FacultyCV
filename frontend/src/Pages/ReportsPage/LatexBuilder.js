import { getAllSections, getUserCVData, getLatexConfiguration } from '../../graphql/graphqlHelpers.js';
import { SHOWN_ATTRIBUTE_GROUP_ID, HIDDEN_ATTRIBUTE_GROUP_ID } from '../TemplatePages/SharedTemplatePageComponents/TemplateModifier/TemplateModifierContext.jsx'

let userCvData = [];

const buildTableHeader = (title) => {
    const header = String.raw`
    \begin{tabularx}{\textwidth}{|Y|}
    \hline
    \rowcolor{headerGray}
    \textbf{${title}} \\
    \hline
    \end{tabularx}%
    \vspace{-1pt}
    `

    return header;
}

const buildTableSubHeader = (title) => {
    const subHeader = String.raw`
    \begin{tabularx}{\textwidth}{|Y|}
    \hline
    \rowcolor{subHeaderGray}
    \textbf{${title}} \\
    \hline
    \end{tabularx}%
    \vspace{-1pt}
    `

    return subHeader;
}

const buildDataEntries = (attributes, dataSectionId) => {
    // Filter userCvData by the given dataSectionId
    const sectionData = userCvData.filter((cvData) => cvData.data_section_id === dataSectionId);

    // Generate LaTeX tables for each entry
    const latexTables = sectionData.map((data) => {
        // Map attributes to their corresponding values in data_details
        const row = attributes.map((attribute) => "testing testing testing 123").join(' & ');

        // Wrap the row in its own tabularx environment
        return String.raw`
        \begin{tabularx}{\textwidth}{|${'Y|'.repeat(attributes.length)}}
        \hline
        ${row} \\
        \hline
        \end{tabularx}%
        \vspace{-1pt}
        `;
    });

    // Join all individual tables
    return latexTables.join('\n');
}

const buildTableSectionColumns = (attributeGroups, attributeRenameMap, dataSectionId) => {
    let latex = "";

    // Find the attribute group with the SHOWN_ATTRIBUTE_GROUP_ID
    const shownAttributeGroup = attributeGroups.find(
        (attributeGroup) => attributeGroup.id === SHOWN_ATTRIBUTE_GROUP_ID
    );

    const attributes = shownAttributeGroup.attributes;

    // Dynamically create the column format string based on the number of attributes
    const columnFormat = `|${'Y|'.repeat(attributes.length)}`;

    // Dynamically create the header row based on the attribute names
    const headerRow = attributes
        .map((attribute) => `\\textbf{${attribute}}`)
        .join(' & ');

    // Start building the LaTeX table
    latex += String.raw`
    \begin{tabularx}{\textwidth}{${columnFormat}}
    \hline
    \rowcolor{columnGray}
    ${headerRow} \\
    \hline
    \end{tabularx}%
    \vspace{-1pt}
    `;

    latex += buildDataEntries(attributes, dataSectionId);

    return latex;
}

const buildPreparedSection = (preparedSection, dataSectionId) => {
    let latex = "";

    latex += buildTableSubHeader(preparedSection.title);

    latex += buildTableSectionColumns(preparedSection.attribute_groups, preparedSection.attribute_rename_map, dataSectionId);

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
    \usepackage[margin=0.5in]{geometry}
    \usepackage{tabularx}
    \usepackage{colortbl}
    \usepackage{array}
    `

    latex += packages;

    const colours = String.raw`
    \definecolor{columnGray}{gray}{0.95}
    \definecolor{headerGray}{gray}{0.6}
    \definecolor{subHeaderGray}{gray}{0.8}
    `

    latex += colours;

    const documentStart = String.raw`
    \newcolumntype{Y}{>{\raggedright\arraybackslash}X}
    \begin{document}
    `

    latex += documentStart

    return latex;
}

export const buildLatex = async (userInfo, template) => {
    const latexConfiguration = JSON.parse(await getLatexConfiguration());
    let latex = buildLatexHeader(userInfo, latexConfiguration);

    // Get all user data
    const allSections = await getAllSections();
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