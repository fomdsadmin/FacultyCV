import * as alasql from "alasql";

// Configure custom AlaSQL functions
export const initializeAlaSQL = () => {
    alasql.fn.DATE_IS_COMPLETE = function (value) {
        if (!value) return false;

        if (String(value).includes('-')) {
            const [, endYear] = value.split("-");

            return endYear.toLowerCase().trim() !== "current";
        } else {
            return false;
        }
    };

    alasql.fn.STRIP_END_PARENS = function (value) {
        if (!value) return value;
        return String(value).replace(/\([^()]*\)$/, '').trim();
    };

    alasql.fn.DOLLAR = function (value) {
        if (value === null || value === undefined || value === '') return '';
        const num = Number(String(value).trim());
        if (isNaN(num)) return String(value);
        return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    };


    alasql.from.EXPAND_DELIMITER_LIST = function (dbtype, opts, cb, idx, query) {
        const column = opts.column;      // column to split
        const delimiter = opts.delimiter; // delimiter
        const table = opts.table || [];   // input table

        const expanded = [];

        console.log("jjfilter column: ", column)
        console.log("jjfilter delimiter: ", delimiter)
        console.log("jjfilter table: ", table)
        console.log("jjfilter opts: ", opts)

        table.forEach(row => {
            const value = row[column];
            if (!value) {
                expanded.push(row);
            } else {
                const items = String(value).split(delimiter).map(str => str.trim());
                console.log("jjfilter value: ", value)
                console.log("jjfilter value after split: ", items)
                items.forEach(item => {
                    const newRow = { ...row };
                    newRow[column] = item;
                    expanded.push(newRow);
                });
            }
        });

        if (cb) return cb(expanded, idx, query);
        return expanded;
    };

    // Specialized function for clinical teaching data aggregation
    alasql.from.AGGREGATE_CLINICAL_TEACHING = function (dbtype, opts, cb, idx, query) {
        const table = opts.table || [];   // input table (already filtered rows)

        // Helper to parse year from dates string
        const extractYear = (dates) => {
            if (!dates) return null;
            const cleanedDates = String(dates).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            const yearMatch = cleanedDates.match(/\d{4}/);
            return yearMatch ? yearMatch[0] : null;
        };

        // Aggregate data by year and course title
        const aggregated = {};

        table.forEach((row) => {
            const year = extractYear(row['dates'] || row['Dates']);
            const courseTitle = row.course_title || '';
            const key = `${year}-${courseTitle}`;

            if (!aggregated[key]) {
                aggregated[key] = {
                    year,
                    student_level: row.student_level || '',
                    course_title: courseTitle,
                    brief_description: row.brief_description || '',
                    totalStudents: 0,
                    totalHours: 0,
                    durations: new Set()
                };
            }

            // Aggregate students
            const numStudents = Number(row.number_of_students || 0);
            if (!Number.isNaN(numStudents)) {
                aggregated[key].totalStudents += numStudents;
            }

            // Aggregate hours
            const numHours = Number(row.total_hours || 0);
            if (!Number.isNaN(numHours)) {
                aggregated[key].totalHours += numHours;
            }

            // Collect durations
            const duration = row['duration_(eg:_8_weeks)'];
            if (duration) {
                aggregated[key].durations.add(String(duration).trim());
            }
        });

        // Convert to array and sort by student level
        const aggregatedArray = Object.values(aggregated)
            .map((item) => ({
                ...item,
                durations: Array.from(item.durations).join(", "),
                totalStudents: item.totalStudents || 0,
                totalHours: item.totalHours || 0
            }))
            .sort((a, b) => {
                const levelA = String(a.student_level || '').toLowerCase();
                const levelB = String(b.student_level || '').toLowerCase();
                return levelA.localeCompare(levelB);
            });

        // Separate rows by course title and add header rows
        const result = [];
        const rowsByCourse = {};

        // Group by course title
        aggregatedArray.forEach((row) => {
            if (!rowsByCourse[row.course_title]) {
                rowsByCourse[row.course_title] = [];
            }
            rowsByCourse[row.course_title].push(row);
        });

        // Add rows with course title headers
        Object.entries(rowsByCourse).forEach(([courseTitle, rows]) => {
            // Add header row for course title
            result.push({
                Description: courseTitle,
                'Duration (e.g. 8 weeks)': "",
                "# of students": "",
                Year: "",
                "Total Hours": "",
                student_level: "",
            });

            // Add data rows
            rows.forEach((row) => {
                result.push({
                    Description: "",
                    'Duration (e.g. 8 weeks)': "8 weeks",
                    "# of students": row.totalStudents,
                    Year: row.year,
                    "Total Hours": row.totalHours,
                    student_level: row.student_level,
                });
            });
        });

        if (cb) return cb(result, idx, query);
        return result;
    };
};

// Execute an AlaSQL query
export const executeAlaSQL = (query, data) => {
    try {
        const res = alasql(query, [data]);
        console.log("JJFILTER query result:", res);
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
