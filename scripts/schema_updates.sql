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
    logged_user_role TEXT,
    logged_user_email TEXT NOT NULL,
    logged_user_action TEXT,
    assistant BOOLEAN,
    profile_record TEXT,

    page TEXT,
    session_id TEXT,
    ip TEXT,
    browser_version TEXT
);

CREATE TABLE affiliations (
    user_id TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    hospital_affiliations JSON,
    institution JSON,
    academic_units JSON,
    research_affiliations JSON,
    faculty JSON
);

ALTER TABLE rise_data
ADD COLUMN IF NOT EXISTS sponsor TEXT;

ALTER TABLE templates 
RENAME data_section_ids TO template_structure;

ALTER TABLE data_sections
ADD COLUMN IF NOT EXISTS attributes_type JSON;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS cwl TEXT;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS vpp TEXT;

ALTER TABLE data_sections
ADD COLUMN IF NOT EXISTS info TEXT DEFAULT 'Summary of section description';

ALTER TABLE users
ADD COLUMN IF NOT EXISTS pending BOOLEAN DEFAULT true;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;
