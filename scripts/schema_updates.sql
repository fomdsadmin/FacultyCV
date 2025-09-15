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

-- August 19th : to be done
ALTER TABLE user_connections
ADD COLUMN IF NOT EXISTS faculty_username VARCHAR DEFAULT '';

ALTER TABLE user_connections
ADD COLUMN IF NOT EXISTS assistant_username VARCHAR DEFAULT '';
-- END

-- August 25th : to be done
update university_info
set value = 'Fraser Health Authority'
where value = 'Fraser Health'

update university_info
set type = 'Authority - Fraser Health Authority'
where type = 'Authority - Fraser Health'

update university_info
set value = 'Interior Health Authority'
where value = 'Interior Health'

update university_info
set type = 'Authority - Interior Health Authority'
where type = 'Authority - Interior Health'

update university_info
set value = 'Island Health Authority'
where value = 'Island Health'

update university_info
set type = 'Authority - Island Health Authority'
where type = 'Authority - Island Health'

update university_info
set value = 'Northern Health Authority'
where value = 'Northern Health'

update university_info
set type = 'Authority - Northern Health Authority'
where type = 'Authority - Northern Health'

INSERT INTO university_info (type, value)
VALUES ('Authority', 'VCH/FHA')
-- END

-- August 28th : to be done
ALTER TABLE users
RENAME username TO cwl_username;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS vpp_username VARCHAR DEFAULT '';
-- END

-- August 29th: to be done
ALTER TABLE users
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT FALSE;
-- END

-- September 15th: to be done
CREATE TABLE scopus_publications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
    data_details JSON,
    is_new BOOLEAN DEFAULT TRUE,
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- END