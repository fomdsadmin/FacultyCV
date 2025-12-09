import * as alasql from "alasql";

// Metadata array for UI
export const customAlaSQLFunctionsMeta = [];

// Helper to register a function in alasql.fn
function registerAlaSQLFunction(name, fn, instructions) {
    alasql.fn[name] = fn;
    customAlaSQLFunctionsMeta.push({ funcName: name, instructions });
}

// Helper to register a table function in alasql.from
function registerAlaSQLFromFunction(name, fn, instructions) {
    alasql.from[name] = fn;
    customAlaSQLFunctionsMeta.push({ funcName: name, instructions });
}

// Initialize custom AlaSQL functions
export const initializeAlaSQL = () => {
    registerAlaSQLFunction(
        "DATE_IS_COMPLETE",
        (value) => {
            if (!value) return false;
            if (String(value).includes("-")) {
                const [, endYear] = value.split("-");
                return endYear.toLowerCase().trim() !== "current";
            }
            return false;
        },
        "DATE_IS_COMPLETE(value) → returns true if the end year in a date range is not 'current'."
    );

    registerAlaSQLFunction(
        "STRIP_END_PARENS",
        (value) => {
            if (!value) return value;
            return String(value).replace(/\([^()]*\)$/, "").trim();
        },
        "STRIP_END_PARENS(value) → removes the last parentheses group from a string."
    );

    registerAlaSQLFunction(
        "DOLLAR",
        (value) => {
            if (value === null || value === undefined || value === "") return "";
            const num = Number(String(value).trim());
            if (isNaN(num)) return String(value);
            return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        },
        "DOLLAR(value) → formats a number as money."
    );

    registerAlaSQLFunction(
        "REMOVE_LETTER_DOT",
        (value) => {
            if (value === null || value === undefined) return "";
            let text = String(value).trim();
            // Remove leading patterns like "e. ", "d. ", "c. ", etc.
            text = text.replace(/^[a-z]\.\s+/i, "");
            return text;
        },
        "REMOVE_LETTER_DOT(value) → removes leading letter-dot patterns (e.g., 'e. ', 'd. ') from text."
    );

    registerAlaSQLFromFunction(
        "SORT_TABLE_BY_DATE_COLUMN",
        (dbtype, opts, cb, idx, query) => {
            // ---- 1. Validate input ----
            const tableName = opts?.table;
            const columnName = opts?.column;

            const variables = alasql.vars;

            const ascendingVar = opts?.ascendingVar ?? "";

            const sortOrderString = String(Object.values(variables?.[ascendingVar]?.[0])?.[0]) || "";
            let isAscending = false;

            if (sortOrderString.toLowerCase().includes("ascending")) {
                isAscending = true;
            }

            if (!tableName || !columnName) {
                const empty = [];
                if (cb) return cb(empty, idx, query);
                return empty;
            }

            // ---- 2. Load table data ----
            let tableData = [];

            try {
                tableData = alasql(`SELECT * FROM ${tableName}`);
            } catch (e) {
                console.error("SORT_TABLE_BY_DATE_COLUMN error:", e);
                const empty = [];
                if (cb) return cb(empty, idx, query);
                return empty;
            }

            // ---- 3. Sort using your algorithm ----

            const monthToNumber = {
                january: 1, jan: 1,
                february: 2, feb: 2,
                march: 3, mar: 3,
                april: 4, apr: 4,
                may: 5,
                june: 6, jun: 6,
                july: 7, jul: 7,
                august: 8, aug: 8,
                september: 9, sep: 9, sept: 9,
                october: 10, oct: 10,
                november: 11, nov: 11,
                december: 12, dec: 12
            };

            const currentYear = new Date().getFullYear();

            const sorted = tableData.sort((a, b) => {
                const rawA = a[columnName] ?? "";
                const rawB = b[columnName] ?? "";

                const [aStartText, aEndText] = String(rawA).split("-");
                const [bStartText, bEndText] = String(rawB).split("-");

                const cleanedA = String(rawA).replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
                const cleanedB = String(rawB).replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

                const monthMatchA = cleanedA.match(/[A-Za-z]+/);
                const yearMatchA = cleanedA.match(/\d{4}/);

                const monthMatchB = cleanedB.match(/[A-Za-z]+/);
                const yearMatchB = cleanedB.match(/\d{4}/);

                let yearA = yearMatchA ? parseInt(yearMatchA[0]) : null;
                const monthA = monthMatchA ? monthMatchA[0] : null;

                let yearB = yearMatchB ? parseInt(yearMatchB[0]) : null;
                const monthB = monthMatchB ? monthMatchB[0] : null;

                if (!yearA) {
                    if (aStartText?.toLowerCase() === "current" || aEndText?.toLowerCase() === "current") {
                        yearA = currentYear;
                    } else {
                        yearA = -Infinity;
                    }
                }

                if (!yearB) {
                    if (bStartText?.toLowerCase() === "current" || bEndText?.toLowerCase() === "current") {
                        yearB = currentYear;
                    } else {
                        yearB = -Infinity;
                    }
                }

                const yearComparison = yearA - yearB;

                // Same year → compare months
                if (yearComparison === 0 && monthA && monthB) {
                    const monthNumA = monthToNumber[monthA.toLowerCase()] || 0;
                    const monthNumB = monthToNumber[monthB.toLowerCase()] || 0;

                    return (monthNumA - monthNumB) * (isAscending ? 1 : -1);
                }

                // Compare by year
                return yearComparison * (isAscending ? 1 : -1);
            });

            // ---- 4. Return result ----
            if (cb) return cb(sorted, idx, query);
            return sorted;
        },
        `SORT_TABLE_BY_DATE_COLUMN("sql", {'table': 'tableName', 'column': 'columnName', 'isAscending': isAscending}) → returns the table sorted by the given date-like column.`
    );


    registerAlaSQLFunction(
        "EXTRACT_OTHER_DATA",
        (value) => {
            if (!value) return "";

            const str = String(value).trim();
            const match = str.match(/\(([^()]*)\)\s*$/); // last parentheses

            if (!match) {
                // No parentheses → return original text + "(Not specified)"
                return `${str} (Not specified)`;
            }

            // Parentheses exist → return inner content
            return match[1];
        },
        "EXTRACT_OTHER_DATA(value) → extracts the content inside the final parentheses, or returns the original text + ' (Not specified)' if none."
    );

    registerAlaSQLFromFunction(
        "GENERATE_TEST_DATA",
        (dbtype, opts, cb, idx, query) => {
            const result = [];

            const numRows = opts?.rows || 500;

            for (let i = 1; i <= numRows; i++) {
                // generate a random date within the last 5 years
                const start = new Date();
                start.setFullYear(start.getFullYear() - 5);
                const end = new Date();
                const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

                // push a row with 'datesd' and 'details'
                result.push({
                    dates: randomDate.toISOString().split('T')[0], // format YYYY-MM-DD
                    details: `Detail #${i}`
                });
            }

            if (cb) return cb(result, idx, query);
            return result;
        },
        `GENERATE_TEST_DATA("sql", {'rows': ...}) → returns 500 rows of test data with columns datesd and details.`
    );

    registerAlaSQLFromFunction(
        "AGGREGATE_CLINICAL_TEACHING",
        (dbtype, opts, cb, idx, query) => {
            const tableInput = opts.table;

            // If tableInput is a string table name (ex: "main")
            // convert it to a real AlaSQL table
            let table;

            if (Array.isArray(tableInput)) {
                table = tableInput; // normal case when using ?
            } else if (typeof tableInput === "string") {
                // The user passed "main" instead of ?
                const t = alasql.tables[tableInput];
                table = t ? t.data : [];
            } else {
                table = [];
            }

            const extractYear = (dates) => {
                if (!dates) return null;

                const datesStr = String(dates).toLowerCase().trim();

                if (datesStr.includes("current")) {
                    return new Date().getFullYear().toString();
                }

                const cleaned = String(dates).replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
                const match = cleaned.match(/\d{4}/);
                return match ? match[0] : "No year entered";
            };

            const aggregated = {};

            table.forEach((row) => {
                const year = extractYear(row["dates"] || row["Dates"]);
                const courseTitle = row.course_title || "";
                const key = year + "-" + courseTitle;

                if (!aggregated[key]) {
                    aggregated[key] = {
                        year,
                        student_level: row.student_level || "",
                        course_title: courseTitle,
                        brief_description: row.brief_description || "",
                        totalStudents: 0,
                        totalHours: 0,
                        durations: new Set()
                    };
                }

                const numStudents = Number(row.number_of_students || 0);
                if (!isNaN(numStudents)) aggregated[key].totalStudents += numStudents;

                const numHours = Number(row.total_hours || 0);
                if (!isNaN(numHours)) aggregated[key].totalHours += numHours;

                const duration = row["duration_(eg:_8_weeks)"];
                if (duration) aggregated[key].durations.add(String(duration).trim());
            });

            const aggregatedArray = Object.values(aggregated).map((item) => {
                return Object.assign({}, item, {
                    durations: Array.from(item.durations).join(", "),
                    totalStudents: item.totalStudents || 0,
                    totalHours: item.totalHours || 0
                });
            });

            const result = [];
            const rowsByCourse = {};

            aggregatedArray.forEach((row) => {
                if (!rowsByCourse[row.course_title]) rowsByCourse[row.course_title] = [];
                rowsByCourse[row.course_title].push(row);
            });

            Object.entries(rowsByCourse).forEach(([courseTitle, rows]) => {
                result.push({
                    Description: courseTitle,
                    "Duration (e.g. 8 weeks)": "",
                    "# of students": "",
                    Year: "",
                    "Total Hours": "",
                    "Student Level": ""
                });

                rows.forEach((row) => {
                    result.push({
                        Description: "",
                        "Duration (e.g. 8 weeks)": row.durations,
                        "# of students": row.totalStudents,
                        Year: row.year,
                        "Total Hours": row.totalHours,
                        "Student Level": row.student_level
                    });
                });
            });

            if (cb) return cb(result, idx, query);
            return result;
        },
        "AGGREGATE_CLINICAL_TEACHING({table}) → aggregates clinical teaching data by year and course. (Only to be used for the clinical teaching section.)"
    );

    registerAlaSQLFunction(
        "WRAP_IN_BOX",
        (value) => {
            if (value === null || value === undefined || String(value).trim() === "") return "";
            return `<div style="border:2px solid black; padding:10px; border-radius:4px; margin:10px;">${String(value)}</div>`;
        },
        "WRAP_IN_BOX(value) → wraps the value in a styled div for display."
    );
};

// Execute an AlaSQL query
export const executeAlaSQL = (query, data) => {
    try {
        const res = alasql(query, [data]);
        return {
            success: true,
            columns: res.length > 0 ? Object.keys(res[0]) : [],
            rows: res
        };
    } catch (err) {
        console.error("AlaSQL query error:", err);
        return {
            success: false,
            error: err.message,
            columns: [],
            rows: []
        };
    }
};

// Execute all queries in sqlSettings, wiping temp tables and loading data from each datasource
export const executeAlaSQLQueries = (sqlSettings, dataMap) => {
    try {
        const tables = alasql("SHOW TABLES");

        tables.forEach((table) => {
            if (table?.tableid) {
                alasql(`DROP TABLE ${table.tableid}`);
            }
        });

        const results = {
            success: true,
            errors: [],
            executedQueries: []
        };

        const dataSources = sqlSettings?.dataSources || [];
        const queries = sqlSettings?.queries || [];

        // Step 1: Load mock data for each data source into AlaSQL tables
        dataSources.forEach(({ dataSource, tableName }) => {
            const mockData = dataMap[tableName];

            if (!mockData || mockData.length === 0) {
                results.errors.push(`No mock data for table ${tableName}`);
                return;
            }

            try {
                // Create a table with the mock data using SELECT INTO
                alasql(`CREATE TABLE ${tableName}`);
                alasql(`SELECT * INTO ${tableName} FROM ?`, [mockData]);
                results.executedQueries.push({
                    type: "DATA_LOAD",
                    table: tableName,
                    dataSource: dataSource,
                    rowsLoaded: mockData.length
                });
            } catch (err) {
                results.errors.push(`Error loading data for ${tableName}: ${err.message}`);
            }
        });

        // Step 2: Execute each query in order
        let finalResult = [];
        let columns = [];
        queries.forEach((queryObj, index) => {
            const { query, note } = queryObj;

            if (!query || query.trim() === "") {
                return; // Skip empty queries
            }

            try {
                const queryResult = alasql(query);

                // Capture the result of the last successful query
                if (queryResult && Array.isArray(queryResult)) {
                    finalResult = queryResult;
                    // Extract column names from the result
                    if (queryResult.length > 0) {
                        columns = Object.keys(queryResult[0]);
                    }
                }

                results.executedQueries.push({
                    query: query,
                    note: note,
                    index: index,
                    success: true
                });
            } catch (err) {
                results.errors.push(`Query ${index}: ${err.message}`);
                results.executedQueries.push({
                    query: query,
                    index: index,
                    success: false,
                    error: err.message
                });
            }
        });

        results.finalResult = finalResult;
        results.columns = columns;
        results.rows = finalResult;
        return results;
    } catch (err) {
        console.error("Error executing AlaSQL queries:", err);
        return {
            success: false,
            error: err.message,
            errors: [err.message],
            executedQueries: []
        };
    }
};
