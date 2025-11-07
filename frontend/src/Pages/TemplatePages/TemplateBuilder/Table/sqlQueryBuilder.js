/**
 * Builds a SQL query from filter, aggregation, and custom SQL settings
 * @param {Object} filterSettings - Filter rules (include/exclude)
 * @param {Object} aggregationSettings - Group by and aggregation settings
 * @param {string} customSqlQuery - Custom SQL query override
 * @param {Object} attributeKeys - Map of display names to actual field names
 */
export const buildSqlQuery = (filterSettings, aggregationSettings, customSqlQuery, attributeKeys = {}) => {
    let query = "SELECT * FROM ?";

    // Build WHERE clause from filter settings
    const whereConditions = buildWhereClause(filterSettings, attributeKeys);
    if (whereConditions) {
        query += ` WHERE ${whereConditions}`;
    }

    // Build GROUP BY and aggregation from aggregation settings
    if (aggregationSettings?.groupBy && aggregationSettings.groupBy.length > 0) {
        const groupByClause = buildGroupByClause(aggregationSettings.groupBy, attributeKeys);
        if (groupByClause) {
            query += ` GROUP BY ${groupByClause}`;
        }

        // Add aggregation fields in SELECT
        if (aggregationSettings?.aggregateFields && aggregationSettings.aggregateFields.length > 0) {
            // Replace SELECT * with specific columns
            query = buildSelectWithAggregation(
                aggregationSettings.groupBy,
                aggregationSettings.aggregateFields,
                whereConditions,
                attributeKeys
            );
        }
    }

    // If custom SQL query is provided, use it instead
    if (customSqlQuery && customSqlQuery.trim()) {
        return customSqlQuery;
    }

    return query;
};

/**
 * Builds WHERE clause from filter settings
 */
const buildWhereClause = (filterSettings, attributeKeys = {}) => {
    if (!filterSettings) return "";

    const conditions = [];

    // Build AND conditions (include rules)
    if (filterSettings.include?.and && filterSettings.include.and.length > 0) {
        const andConditions = filterSettings.include.and
            .map(rule => {
                const fieldName = attributeKeys[rule.attribute] || rule.attribute;
                return `${fieldName} = '${escapeSQL(rule.equals)}'`;
            })
            .join(" AND ");
        conditions.push(`(${andConditions})`);
    }

    // Build OR conditions (exclude rules)
    if (filterSettings.filterOut?.or && filterSettings.filterOut.or.length > 0) {
        const orConditions = filterSettings.filterOut.or
            .map(rule => {
                const fieldName = attributeKeys[rule.attribute] || rule.attribute;
                return `${fieldName} != '${escapeSQL(rule.equals)}'`;
            })
            .join(" OR ");
        conditions.push(`(${orConditions})`);
    }

    return conditions.join(" AND ");
};

/**
 * Builds GROUP BY clause
 */
const buildGroupByClause = (groupBy, attributeKeys = {}) => {
    if (!groupBy || groupBy.length === 0) return "";
    return groupBy.map(g => {
        const fieldName = attributeKeys[g.attribute] || g.attribute;
        return fieldName;
    }).join(", ");
};

/**
 * Builds SELECT with aggregation functions
 */
const buildSelectWithAggregation = (groupBy, aggregateFields, whereClause, attributeKeys = {}) => {
    const selectClauses = [];

    // Add GROUP BY columns
    if (groupBy && groupBy.length > 0) {
        groupBy.forEach(g => {
            const fieldName = attributeKeys[g.attribute] || g.attribute;
            selectClauses.push(fieldName);
        });
    }

    // Add aggregation columns
    if (aggregateFields && aggregateFields.length > 0) {
        aggregateFields.forEach(agg => {
            const fieldName = attributeKeys[agg.attribute] || agg.attribute;
            const label = agg.label || `${agg.operation}_${agg.attribute}`;
            // Escape the label by wrapping in backticks to handle reserved keywords
            selectClauses.push(`${agg.operation.toUpperCase()}(${fieldName}) as \`${label}\``);
        });
    }

    let query = `SELECT ${selectClauses.join(", ")} FROM ?`;

    if (whereClause) {
        query += ` WHERE ${whereClause}`;
    }

    if (groupBy && groupBy.length > 0) {
        const groupByFields = groupBy.map(g => {
            const fieldName = attributeKeys[g.attribute] || g.attribute;
            return fieldName;
        }).join(", ");
        query += ` GROUP BY ${groupByFields}`;
    }

    return query;
};

/**
 * Escapes SQL string values
 */
const escapeSQL = (str) => {
    if (!str) return "";
    return String(str).replace(/'/g, "''");
};

/**
 * Parses a SQL query to extract filter conditions
 * This is used to populate filter settings from a SQL query
 */
export const parseSqlQuery = (sqlQuery) => {
    // Basic parsing - this is a simplified version
    // For complex queries, you might want to use a proper SQL parser library
    const filterSettings = {
        include: { and: [] },
        filterOut: { or: [] }
    };

    if (!sqlQuery) return filterSettings;

    // Extract WHERE clause
    const whereMatch = sqlQuery.match(/WHERE\s+(.*?)(?:GROUP BY|$)/i);
    if (!whereMatch) return filterSettings;

    const whereClause = whereMatch[1].trim();
    
    // Parse AND conditions
    const andConditions = whereClause.split(/\s+AND\s+/i);
    andConditions.forEach(condition => {
        const match = condition.match(/(\w+)\s*=\s*'([^']*)'/);
        if (match) {
            filterSettings.include.and.push({
                attribute: match[1],
                equals: match[2]
            });
        }
    });

    return filterSettings;
};
