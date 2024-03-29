
-- set env var INPUT_CSV to kaggle_limited.csv etc

DROP TABLE IF EXISTS sightings;

CREATE TABLE sightings (
    datetime TIMESTAMP,
    shape VARCHAR(25),
    colour VARCHAR(50),
    duration_seconds INTEGER,
    comments TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country CHAR(2),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
);

ALTER TABLE sightings ADD COLUMN id SERIAL PRIMARY KEY;
UPDATE sightings SET id = nextval(pg_get_serial_sequence('sightings', 'id'));

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_report_text_trgm ON sightings USING gin (report_text gin_trgm_ops);
CREATE INDEX idx_location_text_trgm ON sightings USING gin (location_text gin_trgm_ops);

