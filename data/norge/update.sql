\set ON_ERROR_STOP on

DROP TABLE IF EXISTS sightings;

CREATE TABLE sightings AS SELECT * FROM hovedtabell;

ALTER TABLE sightings 
    ADD COLUMN id SERIAL PRIMARY KEY,
    ADD COLUMN data_report_number INTEGER,
    ADD COLUMN datetime_original VARCHAR(20),  
    ADD COLUMN datetime TIMESTAMP,
    ADD COLUMN datetime_invalid BOOLEAN
;

ALTER TABLE sightings RENAME COLUMN "Beskrivelse(21)" TO report_text;
ALTER TABLE sightings RENAME COLUMN observasjonssted TO location_text;

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_report_text_trgm ON sightings USING gin (report_text gin_trgm_ops);
CREATE INDEX idx_location_text_trgm ON sightings USING gin (location_text gin_trgm_ops);

-- CREATE INDEX full_text_index_report_text ON sightings USING GIN (to_tsvector('english', report_text));
-- CREATE INDEX full_text_index_report_text_norwegian ON sightings USING GIN (to_tsvector('norwegian', report_text));

-- Observation date:

UPDATE sightings
SET
    datetime_original = CONCAT("obs år", '-', "Obs måned", '-', observasjonsdato),
    datetime = CASE 
        WHEN "obs år" IS NOT NULL AND "Obs måned" IS NOT NULL AND observasjonsdato IS NOT NULL THEN
            TO_DATE(
                CONCAT(
                    COALESCE("obs år", ''),
                    '-',
                    CASE WHEN "Obs måned"::integer > 12 THEN '01' ELSE COALESCE(NULLIF("Obs måned", '?'), '01') END,
                    '-',
                    COALESCE(NULLIF(observasjonsdato, '?'), '01')
                ),
                'YYYY-MM-DD'
            )
        ELSE NULL
    END,
    datetime_invalid = CASE 
        WHEN "obs år" IS NOT NULL AND "Obs måned" IS NOT NULL AND observasjonsdato IS NOT NULL AND "Obs måned"::integer > 12 THEN
            true
        ELSE
            false
    END;


ALTER TABLE sightings
    DROP COLUMN observasjonsdato,
    DROP COLUMN "Obs måned",
    DROP COLUMN "obs år";

-- County of sighting: Key (fylke)=(20) is not present in table "fylke". Vest-Agder, Troms, and others are absent.
-- So, skip for now.
-- ALTER TABLE fylke ADD CONSTRAINT pk_fylke PRIMARY KEY (id);
-- ALTER TABLE sightings ADD CONSTRAINT fk_fylke FOREIGN KEY (Fylke) REFERENCES fylke(id);

ALTER TABLE sightings DROP COLUMN "Annet (4,1)"; -- it is empty
ALTER TABLE sightings RENAME COLUMN annet61 TO weather_other;

