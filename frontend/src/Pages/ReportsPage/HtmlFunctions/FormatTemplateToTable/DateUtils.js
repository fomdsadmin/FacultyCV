const getDateAttribute = (sectionData, dataSectionTitle, templateDataStore) => {
    const sectionsMap = templateDataStore.getSectionsMap();
    const section = sectionsMap[dataSectionTitle];

    if (!section) {
        console.warn(`Section not found for dataSectionTitle: ${dataSectionTitle}`);
        return null;
    }

    const sectionAttributesSet = new Set(Object.values(JSON.parse(section.attributes)));

    if (sectionAttributesSet.has("dates")) {
        return "dates";
    } else if (sectionAttributesSet.has("end_date")) {
        return "end_date";
    } else if (sectionAttributesSet.has("year")) {
        return "year";
    } else {
        return null
    }
}

const filterDateRanges = (sectionData, dataSectionTitle, templateDataStore) => {
    const dateAttribute = getDateAttribute(sectionData, dataSectionTitle, templateDataStore);

    if (dateAttribute === null) {
        return sectionData;
    }

    const template = templateDataStore.getTemplate();

    const templateStartYear = Number(template.start_year);
    const templateEndYear = Number(template.end_year);

    if (templateStartYear === 0 || templateEndYear === 0) {
        return sectionData;
    }

    sectionData = sectionData.filter((data) => {

        if (!data["data_details"][dateAttribute]) {
            return true;
        }

        let startYear;
        let endYear;

        const [dirtyStartDate, dirtyEndDate] = data["data_details"][dateAttribute].split("-");

        const currentYear = new Date().getFullYear();

        if (dirtyStartDate) {
            const cleanStartDate = dirtyStartDate.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            const startYearMatch = cleanStartDate.match(/\d{4}/);
            startYear = startYearMatch ? parseInt(startYearMatch[0]) : null;

            if (cleanStartDate && cleanStartDate.toLowerCase() === "current") {
                startYear = currentYear;
            }
        }

        if (dirtyEndDate) {
            const cleanEndDate = dirtyEndDate.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            const endYearMatch = cleanEndDate.match(/\d{4}/);
            endYear = endYearMatch ? parseInt(endYearMatch[0]) : null;

            if (cleanEndDate && cleanEndDate.toLowerCase() === "current") {
                endYear = currentYear;
            }
        }

        // CASE 1: Both startYear and endYear exist normally
        let itemStart = startYear;
        let itemEnd = endYear;

        // CASE 2: Only one exists → treat the item as a single-point year
        if (itemStart == null && itemEnd != null) {
            itemStart = itemEnd;
        }
        if (itemEnd == null && itemStart != null) {
            itemEnd = itemStart;
        }

        // CASE 3: Both missing → can't determine a range
        if (itemStart == null && itemEnd == null) {
            return false;
        }

        // Now perform intersection check:
        // itemStart <= templateEnd AND itemEnd >= templateStart
        return itemStart <= templateEndYear && itemEnd >= templateStartYear;
    });

    return sectionData;
};

const sortSectionData = (sectionData, dataSectionTitle, templateDataStore) => {
    // Handle undefined or null sectionData
    if (!sectionData || !Array.isArray(sectionData)) {
        return sectionData;
    }

    const sortAscending = templateDataStore.getSortAscending();

    const dateAttribute = getDateAttribute(sectionData, dataSectionTitle, templateDataStore);

    if (dateAttribute === null) {
        return sectionData;
    }

    return sectionData.sort((a, b) => {

        const [aStartText, aEndText] = a["data_details"]?.[dateAttribute].split("-");
        const [bStartText, bEndText] = b["data_details"]?.[dateAttribute].split("-");

        const cleanedA = a["data_details"]?.[dateAttribute]?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const cleanedB = b["data_details"]?.[dateAttribute]?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

        const monthMatchA = cleanedA?.match(/[A-Za-z]+/);
        const yearMatchA = cleanedA?.match(/\d{4}/);
        const monthMatchB = cleanedB?.match(/[A-Za-z]+/);
        const yearMatchB = cleanedB?.match(/\d{4}/);

        // Handle null matches with fallbacks
        let yearA = yearMatchA ? parseInt(yearMatchA[0]) : null;
        const monthA = monthMatchA ? monthMatchA[0] : null;
        let yearB = yearMatchB ? parseInt(yearMatchB[0]) : null;
        const monthB = monthMatchB ? monthMatchB[0] : null;

        const currentYear = new Date().getFullYear();
        if (!yearA) {
            if (aStartText?.toLowerCase() === "current" || aEndText?.toLowerCase() === "current") {
                yearA = currentYear;
            } else {
                yearA = -Infinity;
            }
        }

        if (!yearB) {
            if (bStartText?.toLowerCase() === "current" || bEndText?.toLowerCase() === "current") {
                yearB = currentYear
            } else {
                yearB = -Infinity;
            }
        }

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

const appendMissingEndDateWithCurrent = (sectionData, dataSectionTitle, templateDataStore) => {
    const dateAttribute = getDateAttribute(sectionData, dataSectionTitle, templateDataStore);

    if (dateAttribute === null) {
        return sectionData;
    }

    sectionData = sectionData.map((item) => {
        const date = item.data_details?.[dateAttribute];

        if (date && !date.includes("-")) {
            return {
                ...item,
                data_details: {
                    ...item.data_details,
                    [dateAttribute]: date.trim() + " - current",
                },
            };
        }

        return item;
    });

    return sectionData;
}

export { filterDateRanges, sortSectionData, appendMissingEndDateWithCurrent };

