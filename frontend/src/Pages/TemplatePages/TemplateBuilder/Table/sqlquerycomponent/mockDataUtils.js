// Mock data generation utilities
export const generateMockData = (section, keys, attributeKeys, rowCount = null, columnDataTypes = {}) => {
    if (!section) return [];

    const attributesType = section.attributes_type || {};
    const dropdownOptions = section.dropdownOptions || {};

    const mockAdjectives = ["Advanced", "Basic", "Intermediate", "Expert", "Beginner"];
    const mockNouns = ["Seminar", "Workshop", "Conference", "Course", "Training", "Lecture", "Discussion", "Presentation"];

    const generateRandomString = () => {
        const adj = mockAdjectives[Math.floor(Math.random() * mockAdjectives.length)];
        const noun = mockNouns[Math.floor(Math.random() * mockNouns.length)];
        return `${adj} ${noun}`;
    };

    const generateRandomDate = () => {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        const startYear = Math.floor(Math.random() * (2020 - 2000 + 1)) + 2000;
        const endYear = Math.floor(Math.random() * (2025 - startYear + 1)) + startYear;
        const startMonth = months[Math.floor(Math.random() * months.length)];
        const endMonth = months[Math.floor(Math.random() * months.length)];

        const formats = [
            // Single year
            () => `${startYear}`,
            // Year - Year
            () => `${startYear} - ${endYear}`,
            // Month Year - Month Year
            () => `${startMonth} ${startYear} - ${endMonth} ${endYear}`,
            // Current
            () => `Current`,
            // Current - Current
            () => `Current - Current`,
            // Year - Current
            () => `${startYear} - Current`,
        ];

        const randomFormat = formats[Math.floor(Math.random() * formats.length)];
        return randomFormat();
    };

    const generateRandomNumber = () => Math.floor(Math.random() * 1000);

    const generateRandomCSVList = () => {
        // Generate 2-4 comma-separated random strings
        const numItems = Math.floor(Math.random() * 3) + 2; // 2-4 items
        const items = [];
        for (let i = 0; i < numItems; i++) {
            items.push(generateRandomString());
        }
        return items.join(", ");
    };

    // Helper function to generate field value based on column data type
    const getFieldValue = (displayName, fieldName, attrType) => {
        // If it's a dropdown or date type, use the default behavior
        if (attrType === "dropdown" && dropdownOptions[displayName]) {
            const options = dropdownOptions[displayName];
            return options[Math.floor(Math.random() * options.length)];
        } else if (attrType === "date") {
            return generateRandomDate();
        }

        // For other types, check if there's a column-specific data type configuration
        const columnDataType = columnDataTypes[fieldName];

        if (columnDataType === "number") {
            return generateRandomNumber();
        } else if (columnDataType === "csvlist") {
            return generateRandomCSVList();
        } else {
            // Default to string
            return generateRandomString();
        }
    };

    // Find all dropdown attributes and their options
    const dropdownAttributes = Object.entries(keys).filter(([displayName]) =>
        attributesType[displayName] === "dropdown" && dropdownOptions[displayName]
    );

    // Determine how many rows we need based on dropdown options or explicit rowCount
    let mockRows = [];

    if (rowCount !== null && rowCount > 0) {
        // If explicit rowCount is provided, use it
        for (let i = 0; i < rowCount; i++) {
            const row = {};

            for (const [displayName, fieldName] of Object.entries(keys)) {
                const attrType = attributesType[displayName];
                row[fieldName] = getFieldValue(displayName, fieldName, attrType);
            }

            mockRows.push(row);
        }
    } else if (dropdownAttributes.length > 0) {
        // Create a set to track all combinations of dropdown values we need to represent
        // For each dropdown attribute, we need to ensure all its options appear

        // Start by creating one row for each option of the first dropdown
        const [firstDropdownName] = dropdownAttributes[0];
        const firstDropdownOptions = dropdownOptions[firstDropdownName];

        firstDropdownOptions.forEach(option => {
            // For each option of the first dropdown, generate 1-3 rows
            const rowsPerOption = Math.floor(Math.random() * 3) + 1;

            for (let i = 0; i < rowsPerOption; i++) {
                const row = {};

                // Fill in all attributes for this row
                for (const [displayName, fieldName] of Object.entries(keys)) {
                    const attrType = attributesType[displayName];

                    if (attrType === "dropdown" && dropdownOptions[displayName]) {
                        if (displayName === firstDropdownName) {
                            // Use the current option for the first dropdown
                            row[fieldName] = option;
                        } else {
                            // For other dropdowns, pick a random option
                            const opts = dropdownOptions[displayName];
                            row[fieldName] = opts[Math.floor(Math.random() * opts.length)];
                        }
                    } else {
                        row[fieldName] = getFieldValue(displayName, fieldName, attrType);
                    }
                }

                mockRows.push(row);
            }
        });

        // Now ensure all options from other dropdown attributes are also represented
        for (let d = 1; d < dropdownAttributes.length; d++) {
            const [dropdownName] = dropdownAttributes[d];
            const dropdownOpts = dropdownOptions[dropdownName];

            dropdownOpts.forEach(option => {
                // Generate 1-3 rows for each option of this dropdown
                const rowsPerOption = Math.floor(Math.random() * 3) + 1;

                for (let i = 0; i < rowsPerOption; i++) {
                    const row = {};

                    // Fill in all attributes for this row
                    for (const [displayName, fieldName] of Object.entries(keys)) {
                        const attrType = attributesType[displayName];

                        if (attrType === "dropdown" && dropdownOptions[displayName]) {
                            if (displayName === dropdownName) {
                                // Use the current option for this dropdown
                                row[fieldName] = option;
                            } else {
                                // For other dropdowns, pick a random option
                                const opts = dropdownOptions[displayName];
                                row[fieldName] = opts[Math.floor(Math.random() * opts.length)];
                            }
                        } else {
                            row[fieldName] = getFieldValue(displayName, fieldName, attrType);
                        }
                    }

                    mockRows.push(row);
                }
            });
        }
    } else {
        // If no dropdown attributes, generate rows based on rowCount or default 3-5 rows
        let finalRowCount;
        if (rowCount !== null && rowCount > 0) {
            finalRowCount = rowCount;
        } else {
            finalRowCount = Math.floor(Math.random() * 3) + 3;
        }

        for (let i = 0; i < finalRowCount; i++) {
            const row = {};

            for (const [displayName, fieldName] of Object.entries(keys)) {
                const attrType = attributesType[displayName];

                if (attrType === "dropdown" && dropdownOptions[displayName]) {
                    const options = dropdownOptions[displayName];
                    row[fieldName] = options[Math.floor(Math.random() * options.length)];
                } else {
                    row[fieldName] = getFieldValue(displayName, fieldName, attrType);
                }
            }

            mockRows.push(row);
        }
    }

    return mockRows;
};

// Create a new empty row with default values
export const createNewRow = (attributeKeys, dataSource, sectionsMap) => {
    const newRow = {};
    const section = sectionsMap[dataSource];
    const attributesType = section?.attributes_type || {};
    const dropdownOptions = section?.dropdownOptions || {};

    // Create new row with default values
    for (const [displayName, fieldName] of Object.entries(attributeKeys)) {
        const attrType = attributesType[displayName];

        if (attrType === "dropdown" && dropdownOptions[displayName]) {
            const opts = dropdownOptions[displayName];
            newRow[fieldName] = opts[0];
        } else if (attrType === "date") {
            const year = new Date().getFullYear();
            newRow[fieldName] = `${year} - ${year}`;
        } else if (attrType === "number") {
            newRow[fieldName] = 0;
        } else {
            newRow[fieldName] = "";
        }
    }

    return newRow;
};
