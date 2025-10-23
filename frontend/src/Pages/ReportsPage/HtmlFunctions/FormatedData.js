import { HIDDEN_ATTRIBUTE_GROUP_ID, SHOWN_ATTRIBUTE_GROUP_ID } from "Pages/TemplatePages/SharedTemplatePageComponents/TemplateModifier/TemplateModifierContext";
import { getAllSections } from "graphql/graphqlHelpers";
import { getUserCVData } from "graphql/graphqlHelpers";
import { HIDDEN_GROUP_ID } from "Pages/TemplatePages/SharedTemplatePageComponents/TemplateModifier/TemplateModifierContext";
import { getUserDeclarations } from "graphql/graphqlHelpers";
import { normalizeDeclarations } from "Pages/Declarations/Declarations";
import { getUserAffiliations } from "graphql/graphqlHelpers";

let userCvDataMap = {}
let sectionsMap = {};
let template = {};
let sortAscending;
let userInfo;


// Helper function to get CV data for a section
const getUserCvDataMap = (dataSectionId) => {
    return userCvDataMap[dataSectionId] || [];
};

const filterDateRanges = (sectionData, dataSectionId) => {

    const DO_NOT_FILTER_SECTIONS = [
        '7a. Leaves of Absence',
        '6[a-d]. Employment Record',
        '5c. Continuing Education or Training',
        '5d. Continuing Medical Education',
        '5e. Professional Qualifications, Certifications and Licenses',
        '5b. Dissertations',
        '5a. Post-Secondary Education'
    ]

    const section = sectionsMap[dataSectionId];

    const startYear = Number(template.start_year);
    const endYear = Number(template.end_year);

    if (startYear === 0 || endYear === 0) {
        return sectionData;
    }

    if (DO_NOT_FILTER_SECTIONS.includes(section.title)) {
        return sectionData;
    }

    if (!section) {
        console.warn(`Section not found for dataSectionId: ${dataSectionId}`);
        return sectionData;
    }

    let dateAttribute = null;

    const sectionAttributesSet = new Set(Object.values(JSON.parse(section.attributes)));

    if (sectionAttributesSet.has("dates")) {
        dateAttribute = "dates";
    } else if (sectionAttributesSet.has("end_date")) {
        dateAttribute = "end_date";
    } else if (sectionAttributesSet.has("year")) {
        dateAttribute = "year";
    }

    if (dateAttribute === null) {
        return sectionData;
    }

    sectionData = sectionData.filter((data) => {

        if (!data["data_details"][dateAttribute]) {
            return true;
        }

        const cleaned = data["data_details"][dateAttribute].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const yearMatch = cleaned.match(/\d{4}/);

        const year = yearMatch ? parseInt(yearMatch[0]) : null;

        if (year === null) {
            return true;
        }

        return year >= startYear && year <= endYear;
    });

    return sectionData;
};

const sortSectionData = (sectionData, dataSectionId) => {
    // Find the section to get the attribute mapping
    const section = sectionsMap[dataSectionId];
    if (!section) {
        console.warn(`Section not found for dataSectionId: ${dataSectionId}`);
        return sectionData;
    }

    let dateAttribute = null;

    const sectionAttributesSet = new Set(Object.values(JSON.parse(section.attributes)));

    if (sectionAttributesSet.has("dates")) {
        dateAttribute = "dates";
    } else if (sectionAttributesSet.has("end_date")) {
        dateAttribute = "end_date";
    } else if (sectionAttributesSet.has("year")) {
        dateAttribute = "year";
    }

    if (dateAttribute === null) {
        return sectionData;
    }

    return sectionData.sort((a, b) => {
        const cleanedA = a["data_details"]?.[dateAttribute]?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const cleanedB = b["data_details"]?.[dateAttribute]?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

        const monthMatchA = cleanedA?.match(/[A-Za-z]+/);
        const yearMatchA = cleanedA?.match(/\d{4}/);
        const monthMatchB = cleanedB?.match(/[A-Za-z]+/);
        const yearMatchB = cleanedB?.match(/\d{4}/);

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

const buildGroupJson = async (group) => {
    let groupJson = {}

    groupJson["title"] = group.title;
    groupJson["tables"] = [];
    for (const preparedSection of group.prepared_sections) {
        groupJson["tables"].push(...buildPreparedSection(preparedSection, preparedSection.data_section_id));
    }

    return groupJson;
};

const buildClinicalTeachingSection = (preparedSection, dataSectionId) => {

    const buildNewStudentObject = (year, duration, totalHours, studentLevel, course, courseTitle, briefDescription, numberOfStudents = 1) => {
        return {
            year,
            duration,
            total_hours: totalHours,
            student_level: studentLevel,
            number_of_students: numberOfStudents ?? 0,
            course,
            course_title: courseTitle,
            brief_description: briefDescription
        }
    }

    const table = {};

    const sectionData = getUserCvDataMap(preparedSection.data_section_id);

    function aggregateStudentData(flatData) {
        const aggregated = {};

        flatData.forEach(({ duration, number_of_students, year, total_hours, student_level, course_title, brief_description }) => {
            const key = `${year}-${course_title}`;

            if (!aggregated[key]) {
                aggregated[key] = {
                    year,
                    student_level,
                    course_title,
                    brief_description,
                    totalStudents: 0,
                    totalHours: 0,
                    durations: new Set()
                };
            }

            if (Number.isNaN(aggregated[key].totalStudents)) {
                aggregated[key].totalStudents = "";
            }

            if (aggregated[key].totalStudents !== "") {
                aggregated[key].totalStudents += Number(number_of_students);
            }
            aggregated[key].totalHours += Number(total_hours);
            if (duration) {
                aggregated[key].durations.add(duration);
            }
        });

        // convert durations back to array/string
        return Object.values(aggregated).map((item) => ({
            ...item,
            durations: Array.from(item.durations).join(", ")
        }));
    }


    const deaggregatedStudentDataMap = {};
    sectionData.forEach((data, index) => {

        const dateAttribute = "dates";
        const cleanedDates = data["data_details"][dateAttribute].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const yearMatch = cleanedDates.match(/\d{4}/);

        const year = yearMatch ? yearMatch[0] : null;
        const briefDescription = data.data_details["brief_description"];
        const course = data.data_details["course"];
        const courseTitle = data.data_details["course_title"] || "No description (course title) entered";
        const duration = data.data_details["duration_(eg:_8_weeks)"];
        const totalHours = data.data_details["total_hours"];
        const studentLevel = data.data_details["student_level"];
        const numberOfStudents = parseInt(data.data_details["number_of_students"]);

        const normalizedBreifDescription = briefDescription.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

        if (data.data_details["student_name(s)"] && data.data_details["student_name(s)"].length > 1) {

            const studentNames = data.data_details["student_name(s)"]
                .split(",")
                .map((name) => name.trim());

            studentNames.forEach((name) => {

                deaggregatedStudentDataMap[name] ??= {};
                deaggregatedStudentDataMap[name][year] ??= {};
                deaggregatedStudentDataMap[name][year][course] ??= {};
                deaggregatedStudentDataMap[name][year][course][courseTitle] ??= {};
                deaggregatedStudentDataMap[name][year][course][courseTitle][normalizedBreifDescription] ??= {};


                deaggregatedStudentDataMap[name][year][course][courseTitle][normalizedBreifDescription] = buildNewStudentObject(
                    year,
                    duration,
                    totalHours,
                    studentLevel,
                    course,
                    courseTitle,
                    briefDescription
                )
            });
        } else {

            deaggregatedStudentDataMap[index] ??= {};
            deaggregatedStudentDataMap[index][year] ??= {};
            deaggregatedStudentDataMap[index][year][course] ??= {};
            deaggregatedStudentDataMap[index][year][course][courseTitle] ??= {};
            deaggregatedStudentDataMap[index][year][course][courseTitle][normalizedBreifDescription] ??= {};

            deaggregatedStudentDataMap[index][year][course][courseTitle][normalizedBreifDescription] = buildNewStudentObject(
                year,
                duration,
                totalHours,
                studentLevel,
                course,
                courseTitle,
                briefDescription,
                numberOfStudents
            )
        }

    });

    const yearData = Object.entries(deaggregatedStudentDataMap).flatMap(
        ([name, years]) =>
            Object.entries(years).flatMap(([year, courses]) =>
                Object.entries(courses).flatMap(([course, courseTitles]) =>
                    Object.entries(courseTitles).flatMap(([courseTitle, briefDescriptions]) =>
                        Object.entries(briefDescriptions).map(([briefDescription, studentObj]) => ({
                            name,
                            course_title: courseTitle,
                            brief_description: briefDescription,
                            year,
                            course,
                            ...studentObj
                        }))
                    )
                )
            )
    );

    const sortedAggregatedData = aggregateStudentData(yearData).sort((a, b) => {
        const levelA = String(a.student_level || '').toLowerCase();
        const levelB = String(b.student_level || '').toLowerCase();
        return levelA.localeCompare(levelB);
    });

    //const sectionAttributes = JSON.parse(section.attributes);

    const fullRowData = sortedAggregatedData.map((data) => ({
        Description: "",
        "Duration (eg: 8 weeks)": data.durations,
        "Number of Students": data.totalStudents,
        "Total Hours": data.totalHours,
        "Student Level": data.student_level,
        "Course Title (hidden)": data.course_title,
        //"Brief Description": data.brief_description,
        Dates: data.year,
        //Course: data.course
    }));

    const separatedRows = fullRowData.reduce((acc, row, index) => {
        const courseTitle = row["Course Title (hidden)"];

        if (!acc[courseTitle]) {
            acc[courseTitle] = [];
        }

        acc[courseTitle].push(row);
        return acc;
    }, {});

    Object.entries(separatedRows).forEach(([courseTitle, rows]) => {
        console.log(courseTitle); // <-- this is the course title
        console.log(rows);        // <-- these are the rows for that course

        if (!table["rows"]) {
            table["rows"] = [];
        }

        table["rows"].push({
            Description: courseTitle,
            "Duration (eg: 8 weeks)": "",
            "Number of Students": "",
            "Total Hours": "",
            "Student Level": "",
            Dates: "",
            Course: ""
        });

        table["rows"].push(...rows);
    });


    table["columns"] = buildTableSectionColumns(preparedSection);
    table["columns"].unshift({
        headerName: "Description",
        field: "Description"
    })

    let titleToDisplay = preparedSection.renamed_section_title || preparedSection.title;

    table["columns"] = [{
        headerName: titleToDisplay,
        children: table["columns"],
    }]

    return table;
}

const buildPreparedSection = (preparedSection, dataSectionId) => {
    const table = {};
    console.log(preparedSection);
    if (preparedSection.title === "8b.3. Clinical Teaching") {
        return [buildClinicalTeachingSection(preparedSection, dataSectionId)];
    }

    // get table sub sections
    if (preparedSection.sub_section_settings && preparedSection.sub_section_settings.sub_sections.length > 0) {

        const tablesToReturn = buildSubSections(preparedSection);

        if (preparedSection.sub_section_settings.display_section_title) {
            const titleToDisplay = preparedSection.renamed_section_title || preparedSection.title;
            tablesToReturn.unshift({
                justHeader: true,
                noPadding: true,
                columns: [
                    {
                        headerName: titleToDisplay,
                        justHeader: true,
                    }
                ],
                rows: []
            });
        }

        return tablesToReturn;
    }

    table["columns"] = buildTableSectionColumns(preparedSection);

    // get table sub header
    if (!preparedSection.is_sub_section || (preparedSection.is_sub_section && preparedSection.show_header)) {
        let titleToDisplay = preparedSection.renamed_section_title || preparedSection.title;

        const rowCount = getNumberOfRowsInPreparedSection(preparedSection, preparedSection.data_section_id);
        if (preparedSection.show_row_count) {
            titleToDisplay += ` (${rowCount})`
        }

        table["columns"] = [{
            headerName: titleToDisplay,
            children: table["columns"],
        }]
    }

    table["hide_column_header"] = preparedSection.merge_visible_attributes;

    // get table data entries data
    table["rows"] = buildDataEntries(preparedSection, dataSectionId);

    // get table notes data
    table["note_sections"] = buildNotes(preparedSection);

    table["originalPreparedSection"] = preparedSection;

    return [table];
}

const buildNotes = (preparedSection) => {
    if (!preparedSection.note_settings || preparedSection.note_settings.length === 0) {
        return [];
    }

    const dataSectionId = preparedSection.data_section_id;
    const sectionData = getUserCvDataMap(dataSectionId);
    const filteredSectionData = filterDateRanges(sectionData, dataSectionId);
    const section = sectionsMap[dataSectionId];
    const sectionAttributes = JSON.parse(section.attributes);

    if (filteredSectionData.length === 0) {
        return [];
    }

    const noteSections = [];
    const attributeRenameMap = preparedSection.attribute_rename_map || {};
    preparedSection.note_settings.forEach(noteSetting => {
        const noteSection = {};

        const attributeToAssociateWithNote = noteSetting.attribute_to_associate_note;

        noteSection["notes"] = [];
        filteredSectionData.forEach(data => {
            const attributeKey = sectionAttributes[noteSetting.attribute];
            const noteValueToShow = data.data_details[attributeKey];

            const associationKey = sectionAttributes[attributeToAssociateWithNote];
            const associationValue = data.data_details[associationKey];

            if (!noteValueToShow || String(noteValueToShow).trim() === '') {
                return;
            }

            // Filter out highlighted notes that dont belong to section
            if (preparedSection.attribute_filter_value) {
                if (data.data_details[sectionAttributes[preparedSection.section_by_attribute]] !== preparedSection.attribute_filter_value) {
                    return;
                }
            }

            if (attributeToAssociateWithNote && attributeToAssociateWithNote.trim() !== '') {
                // Get the association value
                noteSection["notes"].push({
                    key: associationValue,
                    value: noteValueToShow
                });
            }
        });

        noteSection["title"] = attributeRenameMap[noteSetting.attribute] || noteSetting.attribute;
        noteSections.push(noteSection);
    });

    return noteSections;
};

const getNumberOfRowsInPreparedSection = (preparedSection, dataSectionId) => {

    // Get section data using helper function
    let sectionData = getUserCvDataMap(dataSectionId);

    // Apply date range filtering
    sectionData = filterDateRanges(sectionData, dataSectionId);

    // new logic
    let rows = sectionData.filter((data) => {
        const section = sectionsMap[dataSectionId];

        if (!section || !data || !data.data_details) {
            console.warn('Missing section or data:', { section, data, dataSectionId });
            return false;
        }

        const sectionAttributes = JSON.parse(section.attributes);

        // Only keep data that belongs to this section
        return String(data.data_details[sectionAttributes[preparedSection.section_by_attribute]]) ===
            String(preparedSection.attribute_filter_value);
    }).length;
    return rows
}

const buildDataEntries = (preparedSection, dataSectionId) => {
    const PUBLICATION_SECTION_ID = "1c23b9a0-b6b5-40b8-a4aa-f822d0567f09";
    const RESEARCH_OR_EQUIVALENT_GRANTS_AND_CONTRACTS_ID = "26939d15-7ef9-46f6-9b49-22cf95074e88";

    const attributeGroups = preparedSection.attribute_groups;
    const displayedAttributeGroups = attributeGroups.filter((attributeGroup) => attributeGroup.id !== HIDDEN_ATTRIBUTE_GROUP_ID);
    const attributes = displayedAttributeGroups.flatMap((attributeGroup) => attributeGroup.attributes);

    // Get section data using helper function
    let sectionData = getUserCvDataMap(dataSectionId);

    sectionData = filterDateRanges(sectionData, dataSectionId);

    // Apply sorting
    sectionData = sortSectionData(sectionData, dataSectionId);

    // new logic
    let rowData = sectionData.map((data, rowCount) => {
        const section = sectionsMap[dataSectionId];

        if (!section || !data || !data.data_details) {
            console.warn('Missing section or data:', { section, data, dataSectionId });
            return null;
        }

        const sectionAttributes = JSON.parse(section.attributes);

        // Filter out data that does not belong to this section

        const attributeFilterValue = String(preparedSection.attribute_filter_value).toLowerCase();

        if (attributeFilterValue === "other") {
            const filterAttributedata = String(data.data_details[sectionAttributes[preparedSection.section_by_attribute]]).toLowerCase();

            if (!filterAttributedata.includes("other") && filterAttributedata !== "undefined") {
                return null;
            }
            if (filterAttributedata === "undefined") {
                data.data_details[sectionAttributes[preparedSection.section_by_attribute]] = "Other (no selection)"
            }
        } else {
            if (String(data.data_details[sectionAttributes[preparedSection.section_by_attribute]]) !== String(preparedSection.attribute_filter_value)) {
                return null;
            }
        }

        const rowDict = {};

        rowDict["id"] = rowCount;

        if (!preparedSection.merge_visible_attributes) {
            attributes.forEach((attribute) => {
                rowDict[attribute] = data.data_details[sectionAttributes[attribute]] || '';
            });
        } else {
            rowDict["merged_data"] = attributes
                .map(attribute => {
                    const key = sectionAttributes[attribute];
                    const raw = data.data_details?.[key];
                    return raw == null ? '' : String(raw).replace(/\u00A0/g, ' ');
                })
                .filter(data => data !== "")
                .join(', ');
        }

        if (preparedSection.include_row_number_column) {
            rowDict["Row #"] = rowCount + 1;
        }

        return rowDict;
    })
    rowData = rowData.filter(row => row !== null);
    return rowData;
}

const buildTableSectionUnmergedColumns = (preparedSection) => {
    const columns = [];

    const attributeGroups = preparedSection.attribute_groups;
    const shownAttributeGroups = attributeGroups.filter((attributeGroup) => attributeGroup.id !== HIDDEN_ATTRIBUTE_GROUP_ID);
    const attributeRenameMap = preparedSection.attribute_rename_map;

    const customAttributeGroups = shownAttributeGroups.filter((attributeGroup) => attributeGroup.id !== SHOWN_ATTRIBUTE_GROUP_ID);
    const attributesWithNoGroup = shownAttributeGroups
        .filter((attributeGroup) => attributeGroup.id === SHOWN_ATTRIBUTE_GROUP_ID)
        .flatMap((attributeGroup) => attributeGroup.attributes);

    if (preparedSection.include_row_number_column) {
        attributesWithNoGroup.unshift("Row #");
    }

    const attributesWithNoGroupColumns = attributesWithNoGroup.map((attribute) => ({
        headerName: attributeRenameMap[attribute] || attribute,
        field: attribute
    }));

    const attributesWithGroupColumns = customAttributeGroups.map((attributeGroup) => ({
        headerName: attributeRenameMap[attributeGroup.title] || attributeGroup.title,
        children: attributeGroup.attributes.map((attribute) => ({
            headerName: attributeRenameMap[attribute] || attribute,
            field: attribute
        }))
    }));

    columns.push(...attributesWithNoGroupColumns);
    columns.push(...attributesWithGroupColumns);

    return columns;
}

const buildTableSectionMergedColumns = (preparedSection) => {
    const columns = [];

    columns.push({
        headerName: "",
        field: "merged_data"
    })

    if (preparedSection.include_row_number_column) {
        columns.unshift({
            headerName: "",
            field: "Row #"
        })
    }

    return columns;
}

const buildTableSectionColumns = (preparedSection) => {
    if (!preparedSection.merge_visible_attributes) {
        return buildTableSectionUnmergedColumns(preparedSection);
    } else {
        return buildTableSectionMergedColumns(preparedSection);
    }
}

const buildSubSections = (preparedSectionWithSubSections) => {
    let tables = [];

    const mappedSections = preparedSectionWithSubSections
        .sub_section_settings
        .sub_sections
        .filter((subSection) => !Boolean(subSection.hidden))
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

    for (const mappedSection of mappedSections) {
        tables.push(...buildPreparedSection(mappedSection, mappedSection.data_section_id));
    }

    if (!preparedSectionWithSubSections.sub_section_settings.display_titles) {
        tables = tables.map((table) => ({
            ...table,
            noPadding: true
        }))
    }

    if (preparedSectionWithSubSections.title === "8d.1. Students Supervised") {
        tables = tables.map((table) => ({
            ...table,
            studentsSupervisedSummary: buildStudentSupervisedSummaryCount(table.originalPreparedSection, preparedSectionWithSubSections.data_section_id)
        }))
    }

    return tables;
}

const buildStudentSupervisedSummaryCount = (preparedSection, dataSectionId) => {
    // Get section data using helper function
    let sectionData = getUserCvDataMap(dataSectionId);

    sectionData = sectionData.filter((data) => {
        const section = sectionsMap[dataSectionId];

        if (!section || !data || !data.data_details) {
            console.warn('Missing section or data:', { section, data, dataSectionId });
            return false;
        }

        const sectionAttributes = JSON.parse(section.attributes);

        // Filter out data that does not belong to this section
        const attributeFilterValue = String(preparedSection.attribute_filter_value).toLowerCase();

        if (attributeFilterValue === "other") {
            const filterAttributedata = String(data.data_details[sectionAttributes[preparedSection.section_by_attribute]]).toLowerCase();

            if (!filterAttributedata.includes("other") && filterAttributedata !== "undefined") {
                return false;
            }
            if (filterAttributedata === "undefined") {
                data.data_details[sectionAttributes[preparedSection.section_by_attribute]] = "Other (no selection)"
            }
        } else {
            if (String(data.data_details[sectionAttributes[preparedSection.section_by_attribute]]) !== String(preparedSection.attribute_filter_value)) {
                return false;
            }
        }
        return true;
    })

    sectionData = filterDateRanges(sectionData, dataSectionId);

    let degreeAggregationDict = {};

    const programCodeMap = {
        "Bachelor of Arts (BA)": "BA",
        "Bachelor of Medical Laboratory Science (BMLSc)": "BMLSc",
        "Bachelor of Science (BSc)": "BSc",
        "Co-op Student": "Co-op",
        "Diploma": "Diploma",
        "Directed Studies": "Directed Studies",
        "Fellowship": "Fellowship",
        "Master of Arts (MA)": "MA",
        "Doctor of Medicine (MD)": "MD",
        "Doctor of Medicine–Doctor of Philosophy (MD-PhD)": "MD-PhD",
        "Master of Health Administration (MHA)": "MHA",
        "Master of Occupational Therapy (MOT)": "MOT",
        "Master of Public Health (MPH)": "MPH",
        "Master of Physical Therapy (MPT)": "MPT",
        "Master of Science (MSc)": "MSc",
        "Master of Science–Doctor of Philosophy (MSc-PhD)": "MSc-PhD",
        "Other": "Other",
        "Doctor of Philosophy (PhD)": "PhD",
        "Postdoctoral Study": "Postdoctoral Study",
        "Resident": "Resident",
        "Residency": "Residency",
        "Summer Student": "Summer Student"
    };

    degreeAggregationDict = {
        "BA": { total: 0, current: 0, completed: 0 },
        "BMLSc": { total: 0, current: 0, completed: 0 },
        "BSc": { total: 0, current: 0, completed: 0 },
        "Co-op": { total: 0, current: 0, completed: 0 },
        "Diploma": { total: 0, current: 0, completed: 0 },
        "Directed Studies": { total: 0, current: 0, completed: 0 },
        "Fellowship": { total: 0, current: 0, completed: 0 },
        "MA": { total: 0, current: 0, completed: 0 },
        "MD": { total: 0, current: 0, completed: 0 },
        "MD-PhD": { total: 0, current: 0, completed: 0 },
        "MHA": { total: 0, current: 0, completed: 0 },
        "MOT": { total: 0, current: 0, completed: 0 },
        "MPH": { total: 0, current: 0, completed: 0 },
        "MPT": { total: 0, current: 0, completed: 0 },
        "MSc": { total: 0, current: 0, completed: 0 },
        "MSc-PhD": { total: 0, current: 0, completed: 0 },
        "Other": { total: 0, current: 0, completed: 0 },
        "No Degree Listed": { total: 0, current: 0, completed: 0 },
        "PhD": { total: 0, current: 0, completed: 0 },
        "Postdoctoral Study": { total: 0, current: 0, completed: 0 },
        "Resident": { total: 0, current: 0, completed: 0 },
        "Residency": { total: 0, current: 0, completed: 0 },
        "Summer Student": { total: 0, current: 0, completed: 0 }
    };

    sectionData.forEach((data) => {
        const degree = data.data_details.degree;
        const degreeKey = programCodeMap[degree] || "No Degree Listed";
        const dates = data.data_details.dates;

        const isDegreeInProgress = () => {
            const dateArray = dates.split("-");
            // 2022 - 2024 will give us an array of length 2, thus if the array is of length 1
            // that means there is no end date and the degree is still in progress

            if (dateArray.length === 1) {
                return true;
            } else if (dateArray.length === 2 && dateArray[1].toLowerCase().includes("current")) {
                return true;
            } else {
                return false
            }
        }

        degreeAggregationDict[degreeKey]["total"] += 1;

        if (isDegreeInProgress()) {
            degreeAggregationDict[degreeKey]["current"] += 1;
        } else {
            degreeAggregationDict[degreeKey]["completed"] += 1;
        }
    });

    Object.keys(degreeAggregationDict).forEach((key) => {
        const { total, current, completed } = degreeAggregationDict[key];
        if (total === 0 && current === 0 && completed === 0) {
            delete degreeAggregationDict[key];
        }
    })

    return degreeAggregationDict
}

export const buildCv = async (userInfoInput, templateWithEndStartDate) => {
    const userProfiles = [];
    const userInfoArray = Array.isArray(userInfoInput) ? userInfoInput : [userInfoInput];

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
        userProfile = await buildUserProfile(currentUserInfo);

        // Parse the template structure and process each group
        const parsedGroups = JSON.parse(template.template_structure).groups;
        userProfile["groups"] = [];
        for (const group of parsedGroups || []) {
            if (group.id === HIDDEN_GROUP_ID) {
                continue; // Skip hidden groups
            }

            userProfile["groups"].push(await buildGroupJson(group))
        }

        console.log(`Completed CV for user ${userIndex + 1}/${userInfoArray.length}`);
        userProfiles.push(userProfile);
    }


    console.log(userProfiles);
    return userProfiles;
};

const buildUserProfile = async (userInfoParam) => {
    // Get current date in format "Apr 11, 2025"
    userInfo = userInfoParam;

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
