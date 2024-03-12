
-- set env var INPUT_CSV to kaggle_limited.csv etc

DROP TABLE IF EXISTS sightings;

CREATE TABLE sightings (
    datetime VARCHAR(25),
    city VARCHAR(255),
    state VARCHAR(255),
    country VARCHAR(255),
    shape VARCHAR(25),
    duration_seconds VARCHAR(255),
    duration_hours_min VARCHAR(50),
    comments TEXT,
    date_posted VARCHAR(255),
    latitude VARCHAR(255),
    longitude VARCHAR(255)
);

