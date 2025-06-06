CREATE TABLE declarations (
    id SERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    reporting_year INT NOT NULL,
    created_by TEXT NOT NULL,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    other_data JSONB NOT NULL
);

CREATE TABLE audit_view (
    log_view_id SERIAL PRIMARY KEY,
    ts TIMESTAMP NOT NULL,
 
    logged_user_id INTEGER NOT NULL,
    logged_user_first_name TEXT NOT NULL,
    logged_user_last_name TEXT NOT NULL,
 
    ip INET,
    browser_version TEXT NOT NULL,
    page TEXT,
 
    session_id TEXT NOT NULL,
    assistant BOOLEAN NOT NULL,
    profile_record TEXT,
    logged_user_role TEXT,
    logged_user_email TEXT NOT NULL
);

ALTER TABLE rise_data
ADD COLUMN sponsor TEXT;
