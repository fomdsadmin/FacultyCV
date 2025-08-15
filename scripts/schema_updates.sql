-- August 15th : to be done
DROP TABLE affiliations;

CREATE TABLE affiliations (
    user_affiliation_id varchar DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    primary_unit JSON,
    joint_units JSON,
	research_affiliations JSON,
    hospital_affiliations JSON
);
-- END

    