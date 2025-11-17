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
