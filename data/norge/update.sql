\set ON_ERROR_STOP on
SET client_encoding TO 'UTF8';

DROP TABLE IF EXISTS sightings;

CREATE TABLE sightings AS SELECT * FROM hovedtabell;

ALTER TABLE sightings 
    ADD COLUMN datetime_original VARCHAR(20),  
    ADD COLUMN datetime TIMESTAMP
;

-- Create a auto-incrementing primary key from 'datarapp nr':
ALTER TABLE sightings DROP CONSTRAINT IF EXISTS sightings_pkey;
ALTER TABLE sightings RENAME COLUMN "Datarapp nr" TO id;
ALTER TABLE sightings ALTER COLUMN id TYPE SERIAL;
ALTER TABLE sightings ADD PRIMARY KEY (id);
CREATE SEQUENCE sightings_id_seq OWNED BY sightings.id;
ALTER TABLE sightings ALTER COLUMN id SET DEFAULT nextval('sightings_id_seq');

ALTER TABLE sightings RENAME COLUMN "Beskrivelse(21)" TO report_text;
ALTER TABLE sightings RENAME COLUMN observasjonssted TO location_text;

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_report_text_trgm ON sightings USING gin (report_text gin_trgm_ops);
CREATE INDEX idx_location_text_trgm ON sightings USING gin (location_text gin_trgm_ops);

-- CREATE INDEX full_text_index_report_text ON sightings USING GIN (to_tsvector('english', report_text));
-- CREATE INDEX full_text_index_report_text_norwegian ON sightings USING GIN (to_tsvector('norwegian', report_text));

-- Observation date to datetime:

UPDATE sightings SET 

-- todo: also set a flag for inaccurate date
UPDATE sightings SET "Obs måned" = '01' WHERE "Obs måned" IS NULL OR "Obs måned" = '1';
UPDATE sightings SET "observasjonsdato" = '01' WHERE "observasjonsdato" IS NULL OR "observasjonsdato" = '13';
UPDATE sightings SET "obs år" = REPLACE("obs år", '?', '0');

UPDATE sightings
SET
    datetime_original = "obs år" || '-' || "Obs måned" || '-' || "observasjonsdato",
    datetime = CASE 
        WHEN "obs år" IS NOT NULL AND "Obs måned" IS NOT NULL AND observasjonsdato IS NOT NULL THEN
            TO_DATE(
                CONCAT(
                    COALESCE("obs år", '0000'),
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
        WHEN datetime IS NULL THEN
            true
        ELSE
            false
        END;


UPDATE sightings
SET datetime = 
    CASE 
        WHEN datetime = '0001-01-01 00:00:00' THEN NULL
        WHEN datetime = '0960-06-30 00:00:00' THEN '1960-06-30 00:00:00'
        ELSE datetime
    END;

-- County of sighting: Key (fylke)=(20) is not present in table "fylke". Vest-Agder, Troms, and others are absent.
-- So, skip for now.
-- ALTER TABLE fylke ADD CONSTRAINT pk_fylke PRIMARY KEY (id);
-- ALTER TABLE sightings ADD CONSTRAINT fk_fylke FOREIGN KEY (Fylke) REFERENCES fylke(id);

-- ALTER TABLE sightings DROP COLUMN "Annet (4,1)"; -- it is empty
-- ALTER TABLE sightings RENAME COLUMN annet61 TO weather_other;




-- Joined tables: add some English, make real joins
-- 104 "Fenomenet ble observert med/gjennom(104)" --> "observed_via" 
ALTER TABLE sightings ADD COLUMN "observed_via_id" VARCHAR(50);
UPDATE sightings SET observed_via = "Fenomenet ble observert med/gjennom(104)";
ALTER TABLE sightings ALTER COLUMN observed_via_id TYPE INTEGER USING observed_via_id::INTEGER;
ALTER TABLE "104" RENAME TO observed_via;
ALTER TABLE observed_via ADD CONSTRAINT observed_via_id_unique UNIQUE (id);
ALTER TABLE observed_via ALTER COLUMN id TYPE INTEGER USING id::INTEGER;
INSERT INTO observed_via (id, "Observert med/gjennom(104)") VALUES (0, 'Not specified');
ALTER TABLE sightings ADD CONSTRAINT fk_observed_via_id FOREIGN KEY ("observed_via_id") REFERENCES "observed_via" (id);
-- SELECT sightings.observed_via_id, observed_via.* FROM sightings JOIN observed_via ON sightings.observed_via_id = observed_via.id;


-- 112 "Fysiske pÕvirkninger(112)" --> physical_effects_id -> yes_no_dontknow.id
ALTER TABLE sightings ADD COLUMN physical_effects_id VARCHAR(50);
UPDATE sightings SET physical_effects_id = "Fysiske pÕvirkninger(112)";
ALTER TABLE sightings ALTER COLUMN physical_effects_id TYPE INTEGER USING physical_effects_id::INTEGER;
ALTER TABLE "112" RENAME TO yes_no_dontknow;
ALTER TABLE yes_no_dontknow ADD CONSTRAINT yes_no_dontknow_id_unique UNIQUE (id);
ALTER TABLE yes_no_dontknow ALTER COLUMN id TYPE INTEGER USING id::INTEGER;
ALTER TABLE yes_no_dontknow RENAME COLUMN "Avgj°relse" TO "yes_no_dontknow";
ALTER TABLE yes_no_dontknow ALTER COLUMN yes_no_dontknow TYPE VARCHAR(20);
INSERT INTO yes_no_dontknow (id, "yes_no_dontknow") VALUES (0, 'Not specified');
ALTER TABLE sightings ADD CONSTRAINT fk_physical_effects_id FOREIGN KEY ("physical_effects_id") REFERENCES "yes_no_dontknow" (id);
-- SELECT sightings.physical_effects_id, yes_no_dontknow.* FROM sightings JOIN yes_no_dontknow ON sightings.physical_effects_id = yes_no_dontknow.id;

-- 121 "Himmelen var ved observasjonen(121)" --> sky_condition
ALTER TABLE sightings ADD COLUMN sky_condition_id VARCHAR(20);
UPDATE sightings SET sky_condition_id = "Himmelen var ved observasjonen(121)";
ALTER TABLE sightings ALTER COLUMN sky_condition_id TYPE INTEGER USING sky_condition_id::INTEGER;
ALTER TABLE "121" RENAME TO sky_condition;
ALTER TABLE sky_condition ADD CONSTRAINT sky_condition_unique UNIQUE (id);
ALTER TABLE sky_condition ALTER COLUMN id TYPE INTEGER USING id::INTEGER;
ALTER TABLE sky_condition RENAME COLUMN "Himmelen var ved observasjonen(121)" TO "sky_condition";
ALTER TABLE sky_condition ALTER COLUMN sky_condition TYPE VARCHAR(20);
INSERT INTO sky_condition (id, "sky_condition") VALUES (0, 'Not specified');
ALTER TABLE sightings ADD CONSTRAINT fk_sky_condition_id FOREIGN KEY (sky_condition_id) REFERENCES "sky_condition" (id);
-- SELECT sightings.sky_condition_id, sky_condition.* FROM sightings JOIN sky_condition ON sightings.sky_condition_id = sky_condition.id;

-- 127 "Solen befant seg(12,7)" --> sun_position
ALTER TABLE sightings ADD COLUMN sun_position_id VARCHAR(20);
UPDATE sightings SET sun_position_id = "Solen befant seg(12,7)";
ALTER TABLE sightings ALTER COLUMN sun_position_id TYPE INTEGER USING sun_position_id::INTEGER;
ALTER TABLE "127" RENAME TO sun_position;
ALTER TABLE sun_position ADD COLUMN id INTEGER;
ALTER TABLE sun_position ADD CONSTRAINT sun_position_unique UNIQUE (id);
ALTER TABLE sun_position ALTER COLUMN id TYPE INTEGER USING id::INTEGER;
ALTER TABLE sun_position RENAME COLUMN "Solen befant seg(127)" TO "sun_position";
ALTER TABLE sun_position ALTER COLUMN sun_position TYPE VARCHAR(20);

INSERT INTO sun_position (id, sun_position) VALUES (0, 'Not specified');
UPDATE sun_position SET id=1 WHERE sun_position='Annet';
UPDATE sun_position SET id=2 WHERE sun_position='Bak';
UPDATE sun_position SET id=3 WHERE sun_position='Foran';
UPDATE sun_position SET id=4 WHERE sun_position='Ikke oppe';
UPDATE sun_position SET id=5 WHERE sun_position='Ikke synlig';
UPDATE sun_position SET id=6 WHERE sun_position='Rett over';
UPDATE sun_position SET id=7 WHERE sun_position='Til h°yre';
UPDATE sun_position SET id=8 WHERE sun_position='Til venstre';
UPDATE sun_position SET id=9 WHERE sun_position='Vet ikke';
ALTER TABLE sightings ADD CONSTRAINT fk_sun_position_id FOREIGN KEY (sun_position_id) REFERENCES "sun_position" (id);
-- SELECT sightings.sun_position_id, sun_position.* FROM sightings JOIN sun_position ON sightings.sun_position_id = sun_position.id;

