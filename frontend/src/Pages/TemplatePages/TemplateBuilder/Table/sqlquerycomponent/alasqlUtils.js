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

    registerAlaSQLFromFunction(
        "EXPAND_DELIMITER_LIST",
        (dbtype, opts, cb, idx, query) => {
            const column = opts.column;
            const delimiter = opts.delimiter;
            const table = opts.table || [];
            const expanded = [];

            table.forEach((row) => {
                const value = row[column];
                if (!value) {
                    expanded.push(row);
                } else {
                    String(value).split(delimiter).map((s) => s.trim()).forEach((item) => {
                        const newRow = Object.assign({}, row, { [column]: item });
                        expanded.push(newRow);
                    });
                }
            });

            if (cb) return cb(expanded, idx, query);
            return expanded;
        },
        "EXPAND_DELIMITER_LIST({table, column, delimiter}) → splits a column by delimiter and returns multiple rows."
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
            const table = opts.table || [];

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
                    student_level: ""
                });

                rows.forEach((row) => {
                    result.push({
                        Description: "",
                        "Duration (e.g. 8 weeks)": "8 weeks",
                        "# of students": row.totalStudents,
                        Year: row.year,
                        "Total Hours": row.totalHours,
                        student_level: row.student_level
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
