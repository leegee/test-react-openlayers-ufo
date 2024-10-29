SET search_path TO public;

DROP TABLE IF EXISTS sightings;

CREATE TABLE sightings (
    id SERIAL PRIMARY KEY,
    datetime VARCHAR(25),
    city VARCHAR(255),
    state VARCHAR(255),
    country CHAR(2),
    shape VARCHAR(25),
    colour VARCHAR(50),
    rgb VARCHAR(10),
    duration_seconds INTEGER,
    report_text TEXT,
    location_text TEXT,
    address TEXT,
    date_posted VARCHAR(255),
    latitude VARCHAR(255),
    longitude VARCHAR(255),
    source VARCHAR(15),
    point GEOMETRY(Point, 3857)
    CHECK (source IN ('norge-ufo', 'mufon-kaggle'))
);

DROP INDEX IF EXISTS spatial_index_point;
CREATE INDEX spatial_index_point ON sightings USING gist (point);

CREATE EXTENSION IF NOT EXISTS pg_trgm;

DROP INDEX IF EXISTS idx_report_text_trgm;
CREATE INDEX idx_report_text_trgm ON sightings USING gin (report_text gin_trgm_ops);

DROP INDEX IF EXISTS idx_location_text_trgm;
CREATE INDEX idx_location_text_trgm ON sightings USING gin (location_text gin_trgm_ops);

