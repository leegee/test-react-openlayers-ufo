
-- set env var INPUT_CSV to kaggle_limited.csv etc

DROP TABLE IF EXISTS sightings;
CREATE TABLE sightings (
    datetime TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country TEXT,
    shape VARCHAR(25),
    duration_seconds TEXT,
    duration_hours_mins TEXT,
    comments TEXT,
    date_posted TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
);
