import { getAllSections, getUserCVData, getLatexConfiguration } from '../../graphql/graphqlHelpers.js';

const buildLatexHeader = (userInfo, latexConfiguration) => {
    console.log(userInfo)
    return String.raw`
    \documentclass{article}
    \usepackage[utf8]{inputenc}
    \usepackage{textgreek}
    \usepackage[margin=${latexConfiguration.margin}cm]{geometry}
    \usepackage{array}
    \usepackage{booktabs}
    \usepackage{tabularx}
    \usepackage{longtable} 
    \usepackage{hyperref}
    \usepackage{fontspec}

    \begin{document}
    \small
    
    \begin{center}
    \textbf{\Large University of British Columbia} \\
    \textbf{\Large Curriculum Vitae for Faculty Members} \\
    \end{center}
    
    \begin{flushleft}
    \begin{tabularx}{\textwidth}{@{}lXr@{}}
    \textbf{INITIALS:} & ${userInfo.first_name.charAt(0) + userInfo.last_name.charAt(0)} & \textbf{Date:} ${new Date().toLocaleDateString("en-CA")} \\
    \end{tabularx}
    \end{flushleft}
    
    \begin{flushleft}
    \begin{tabularx}{\textwidth}{|p{3cm}|X|p{3cm}|X|}
    \hline
    \textbf{SURNAME:} & ${userInfo.last_name} &
    \textbf{FIRST NAME:} & ${userInfo.first_name} \\
    \hline
    \end{tabularx}
    \end{flushleft}
    
    \vspace{${latexConfiguration.vspace}cm}
    
    \begin{flushleft}
    \begin{tabularx}{\textwidth}{|p{4cm}|X|}
    \hline
    \textbf{DEPARTMENT:} & ${userInfo.primary_department} \\
    \hline
    \end{tabularx}
    \end{flushleft}
    
    \vspace{${latexConfiguration.vspace}cm}
    
    \begin{flushleft}
      \textbf{JOINT APPOINTMENTS:} \\
      \begin{tabularx}{\textwidth}{|X|}
      \hline
      ${userInfo.secondary_department || ''}${userInfo.secondary_department && userInfo.primary_faculty ? ', ' : ''}${userInfo.primary_faculty || ''}${(userInfo.secondary_department || userInfo.primary_faculty) && userInfo.secondary_faculty ? ', ' : ''}${userInfo.secondary_faculty || ''} \\
      \hline
      \end{tabularx}
    \end{flushleft}

    \vspace{${latexConfiguration.vspace}cm}
    
    \begin{flushleft}
    \textbf{AFFILIATIONS:} \\
    \begin{tabularx}{\textwidth}{|X|}
    \hline
    ${userInfo.primary_affiliation || ''}${userInfo.primary_affiliation && userInfo.secondary_affiliation ? ', ' : ''}${userInfo.secondary_affiliation || ''} \\
    \hline
    \end{tabularx}
    \end{flushleft}
    
    \vspace{${latexConfiguration.vspace}cm}
    
    \begin{flushleft}
    \textbf{LOCATION(S):} \\
    \begin{tabularx}{\textwidth}{|X|}
    \hline
    ${userInfo.campus} \\
    \hline
    \end{tabularx}
    \end{flushleft}
    
    \vspace{${latexConfiguration.vspace}cm}
    
    \begin{flushleft}
    \begin{tabularx}{\textwidth}{|p{5cm}|X|}
    \hline
    \textbf{PRESENT RANK:} & ${userInfo.rank} \\
    \hline
    \end{tabularx}
    \end{flushleft}
    \vspace{${latexConfiguration.vspace}cm}
  `;
};

const calculateColumnWidths = (headers, totalWidth = 19, columnSpacing = 0.5) => {
    const numColumns = headers.length;
    const totalSpacing = (numColumns - 1) * columnSpacing;
    const contentWidth = totalWidth - totalSpacing;
    const columnWidth = (contentWidth / numColumns).toFixed(2);
    return headers.map(() => `p{${columnWidth}cm}`).join(" | ");
};

const filterDataByDateRange = (parsedData, preparedSection, template) => {
    const currentYear = new Date().getFullYear().toString();

    const isWithinRange = (year, startYear, endYear) => {
        if (endYear === "Current") {
            return parseInt(year) >= parseInt(startYear);
        }
        return (
            parseInt(year) >= parseInt(startYear) &&
            parseInt(year) <= parseInt(endYear)
        );
    };

    const extractYearFromDates = (dates) => {
        if (dates.includes("-")) {
            const parts = dates.split("-");
            const endDate = parts[1].trim();
            if (endDate === "Current") {
                return currentYear;
            }
            return endDate.split(", ")[1];
        }
        return dates.split(", ")[1];
    };

    const filtered = parsedData.filter((item) => {
        if (item.data_section_id !== preparedSection.data_section_id) {
            return false;
        }

        const { data_details } = item;
        if (!data_details) {
            return false;
        }

        const { year, year_published, dates } = data_details;
        const startYear = template.start_year;
        const endYear = template.end_year;

        if (year) {
            return isWithinRange(year, startYear, endYear);
        }
        if (year_published) {
            return isWithinRange(year_published, startYear, endYear);
        }
        if (dates) {
            const extractedYear = extractYearFromDates(dates);
            return isWithinRange(extractedYear, startYear, endYear);
        }

        return false;
    });

    // Apply sorting based on prepared section configuration
    if (preparedSection.sort) {
        const { numerically, ascending } = preparedSection.sort;

        return filtered.sort((a, b) => {
            const getYear = (item) => {
                const { year, year_published, dates } = item.data_details;
                if (year) return parseInt(year);
                if (year_published) return parseInt(year_published);
                if (dates) return parseInt(extractYearFromDates(dates));
                return 0;
            };

            if (numerically) {
                const yearA = getYear(a);
                const yearB = getYear(b);
                return ascending ? yearA - yearB : yearB - yearA;
            } else {
                // Alphabetical sorting - you might want to specify which field to sort by
                const titleA = a.data_details.title || '';
                const titleB = b.data_details.title || '';
                return ascending ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA);
            }
        });
    }

    return filtered;
};

const processGroupSection = async (preparedSection, parsedData, template, latexConfiguration) => {
    // Filter data for this section
    const sectionData = filterDataByDateRange(parsedData, preparedSection, template);

    if (sectionData.length === 0) {
        return '';
    }

    // Get attributes from SHOWN_ATTRIBUTE_GROUP_ID
    const shownAttributeGroup = preparedSection.attribute_groups.find(
        group => group.id === 'SHOWN_ATTRIBUTE_GROUP_ID' || group.title === 'SHOWN_ATTRIBUTE_GROUP_ID'
    );

    if (!shownAttributeGroup || !shownAttributeGroup.attributes || shownAttributeGroup.attributes.length === 0) {
        return '';
    }

    let latex = '';

    // Use renamed section title if provided, otherwise use original title
    const sectionTitle = preparedSection.renamed_section_title || preparedSection.title;
    latex += String.raw`\subsection*{${sectionTitle}}`;

    // Add row count if enabled
    if (preparedSection.show_row_count && preparedSection.count_rows) {
        latex += ` (${sectionData.length})`;
    }

    latex += String.raw`\vspace{-1.0em}` + '\n';

    // Get column headers from shown attributes
    const headers = shownAttributeGroup.attributes.map(attr => {
        // Check if attribute is renamed in the rename map
        return preparedSection.attribute_rename_map?.[attr] || attr;
    });

    // Build table based on number of columns
    if (headers.length === 1) {
        // Single column with numbering
        latex += String.raw`\begin{longtable}{| p{0.5cm} | p{17.7cm} |}` + '\n';
        latex += String.raw`\hline` + '\n';

        sectionData.forEach((item, index) => {
            const key = shownAttributeGroup.attributes[0].replace(/\s+/g, "_").toLowerCase();
            const value = item.data_details[key] || '';
            latex += `${index + 1} & ${value} ` + String.raw`\\ \hline` + '\n';
        });
    } else {
        // Multi-column table
        const columns = calculateColumnWidths(headers, 21.6 - 2 * latexConfiguration.margin);

        latex += String.raw`\begin{longtable}{| ${columns} |}` + '\n';
        latex += String.raw`\hline` + '\n';

        // Add headers
        latex += headers.map(header => String.raw`\textbf{${header}}`).join(" & ") + String.raw` \\ \hline` + '\n';

        // Add data rows
        sectionData.forEach(item => {
            const row = shownAttributeGroup.attributes.map(attr => {
                const key = attr.replace(/\s+/g, "_").toLowerCase();
                const value = item.data_details[key];
                return value !== undefined ? value : '';
            }).join(" & ");
            latex += `${row} ` + String.raw`\\ \hline` + '\n';
        });
    }

    latex += String.raw`\end{longtable}\vspace{${latexConfiguration.vspace}cm}` + '\n\n';
    return latex;
};

export const buildLatex = async (userInfo, template) => {
    const latexConfiguration = JSON.parse(await getLatexConfiguration());
    let latex = buildLatexHeader(userInfo, latexConfiguration);

    // Get all user data
    const allSections = await getAllSections();
    const allSectionIds = allSections.map(section => section.data_section_id);
    const userData = await getUserCVData(userInfo.user_id, allSectionIds);

    // Parse user data
    const parsedData = userData.map((data) => {
        let dataDetails;
        try {
            dataDetails = JSON.parse(data.data_details);
        } catch (e) {
            dataDetails = data.data_details;
        }
        return { ...data, data_details: dataDetails };
    });

    // Parse the template structure first
    const parsedGroups = JSON.parse(template.template_structure);

    // Process each group in the template
    for (const group of parsedGroups || []) {
        if (group.id === 'HIDDEN_GROUP_ID') continue; // Skip hidden groups

        // Add group title if it exists and isn't a special ID
        if (group.title && group.title !== 'SHOWN_GROUP_ID') {
            latex += String.raw`\section*{${group.title}}` + '\n';
        }

        // Process each prepared section in the group
        for (const preparedSection of group.prepared_sections || []) {
            latex += await processGroupSection(preparedSection, parsedData, template, latexConfiguration);
        }
    }

    latex += String.raw`\end{document}`;
    return latex;
};