# SQL Query Component - Implementation Guide

## Overview

The `SQLQueryComponent` is a fully browser-compatible React component that allows users to execute SQL queries on data fetched from the GraphQL API using DuckDB WASM.

## File Location

`frontend/src/Pages/TemplatePages/TemplateBuilder/Table/SQLQueryComponent.jsx`

## Features

✅ **Browser-Compatible**: Uses only browser APIs, no Node.js-specific code  
✅ **GraphQL Integration**: Fetches data from `getUserCVData` for user_id 92  
✅ **DuckDB WASM**: Queries data using DuckDB's browser-compatible WASM implementation  
✅ **Interactive UI**: Text area for SQL queries with Ctrl+Enter execution  
✅ **Result Display**: Displays results in a formatted table  
✅ **Error Handling**: Comprehensive error messages and loading states  
✅ **JSON Support**: Properly handles JSON and nested object data  

## How It Works

### 1. Initialization Phase
- On mount, the component initializes DuckDB WASM using `AsyncDuckDB`
- Loads the appropriate bundle from jsDelivr CDN
- Stores database and connection references in `useRef` for persistence

### 2. Data Loading Phase
- Fetches CV data from GraphQL `getUserCVData` API
- Parses `data_details` JSON strings into objects
- Stores data in component state

### 3. Query Execution Phase
- When user submits a SQL query:
  1. Drops any existing `cv_data` table
  2. Infers schema from the first data item
  3. Creates a new table with appropriate column types
  4. Inserts all data using properly escaped INSERT VALUES statement
  5. Executes the user's SQL query
  6. Returns results as a formatted table

## API Reference

### Props

| Prop | Type | Description |
|------|------|-------------|
| `dataSource` | string/object | The datasource identifier (triggers data loading when provided) |

### State Variables

- `query`: Current SQL query text
- `results`: Query results with columns and rows
- `loading`: Loading state
- `error`: Error message
- `data`: Loaded data array
- `dbRef`: Reference to AsyncDuckDB instance
- `connRef`: Reference to database connection

## Database Schema

The component creates a table named `cv_data` with columns inferred from the GraphQL response.

### Column Type Inference

- **NULL/undefined**: VARCHAR
- **numbers**: DOUBLE
- **booleans**: BOOLEAN  
- **JSON strings**: JSON
- **other strings**: VARCHAR
- **objects**: VARCHAR (serialized as JSON string)

## Usage Example

```jsx
import SQLQueryComponent from './SQLQueryComponent';

function MyComponent() {
  return (
    <SQLQueryComponent dataSource="section-1" />
  );
}
```

### Sample Queries

```sql
-- Select all records
SELECT * FROM cv_data LIMIT 10;

-- Count records
SELECT COUNT(*) as total FROM cv_data;

-- Filter by column
SELECT * FROM cv_data WHERE id = '92';

-- Group and aggregate
SELECT category, COUNT(*) as count FROM cv_data GROUP BY category;
```

## Key Implementation Details

### Browser Compatibility

- Uses `@duckdb/duckdb-wasm@1.30.0`
- No Node.js APIs (no require, fs, path, Buffer)
- No dynamic imports
- Proper cleanup on component unmount

### Data Insertion Strategy

Instead of using unsupported methods like `registerJavaScriptArray` or `json_scan()`, the component:
1. Infers column types from the first row
2. Creates a table with proper schema
3. Uses standard SQL INSERT VALUES with escaped strings
4. This approach is 100% compatible with DuckDB WASM browser builds

### Error Handling

- Gracefully handles data loading errors
- Provides clear SQL syntax error messages
- Handles database initialization failures
- Cleans up resources on unmount

## Performance Considerations

- Large datasets (>10,000 rows) with many columns may slow down query execution
- For very large datasets, consider using pagination or limiting results with LIMIT clause
- Query optimization depends on SQL query structure

## Troubleshooting

### "DuckDB is not initialized"
- Wait for DuckDB to initialize on component mount
- Check browser console for initialization errors

### "No data available to query"
- Ensure `dataSource` prop is provided
- Check GraphQL response and network tab

### Query execution fails
- Check SQL syntax (DuckDB SQL dialect)
- Verify column names match those in fetched data
- Check that table name is exactly `cv_data`

## Future Enhancements

- Add query history/saved queries
- Support for multiple tables
- Query suggestions/autocomplete
- Export results to CSV
- Query performance metrics
- Support for custom upload data
