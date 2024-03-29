ALTER TABLE sightings 
  DROP COLUMN duration_hours_min,
  ALTER COLUMN date_posted TYPE DATE USING TO_DATE(date_posted, 'MM/DD/YYYY'),
  ALTER COLUMN datetime TYPE DATE USING TO_DATE(datetime, 'MM/DD/YYYY'),
  ADD COLUMN source VARCHAR(25) CHECK (source IN ('mufon-kaggle')),
  ADD COLUMN point GEOMETRY(POINT, 3857),
  ADD COLUMN location_text VARCHAR(255),
  ADD COLUMN address VARCHAR(255),
  ADD COLUMN datetime_invalid BOOLEAN default false,
  ADD COLUMN datetime_original VARCHAR(40);

ALTER TABLE sightings RENAME COLUMN comments TO report_text;

ALTER TABLE sightings ADD COLUMN id SERIAL PRIMARY KEY;
UPDATE sightings SET id = nextval(pg_get_serial_sequence('sightings', 'id'));

ALTER TABLE sightings
  ALTER COLUMN latitude TYPE double precision USING latitude::double precision,
  ALTER COLUMN longitude TYPE double precision USING longitude::double precision;

UPDATE sightings SET location_text = city || ' ' || COALESCE(state, '') || ' ' || COALESCE(country, '');
UPDATE sightings SET "address" = location_text;
UPDATE sightings SET datetime_original = datetime;

UPDATE sightings
  SET duration_seconds = CAST(REGEXP_REPLACE(duration_seconds, '[^0-9.]', '', 'g') AS NUMERIC(10, 2));

UPDATE sightings 
  SET point = ST_Transform(
    ST_SetSRID( ST_MakePoint(longitude, latitude ), 4326),
    3857
  );

ALTER TABLE sightings 
  DROP COLUMN longitude,
  DROP COLUMN latitude;

UPDATE sightings SET source = 'mufon-kaggle';

CREATE INDEX ON sightings (datetime);
CREATE INDEX ON sightings (date_posted);
CREATE INDEX ON sightings USING GIST (point);

-- Check the results
SELECT COUNT(*) AS total_in_table FROM sightings;

SELECT COUNT(*) AS no_lat_lng FROM sightings WHERE point IS NULL;


-- HTML entity conversion:
CREATE OR REPLACE FUNCTION decode_html_entities(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
   entity_map TEXT[] := ARRAY[
        '&amp;', '&lt;', '&gt;', '&quot;', '&#180;', '&apos;', '&aring;', '&Aring;', '&aelig;', '&AElig;',
        '&oslash;', '&Oslash;', '&ccedil;', '&Ccedil;', '&auml;', '&Auml;', '&euml;', '&Euml;',
        '&iuml;', '&Iuml;', '&ouml;', '&Ouml;', '&uuml;', '&Uuml;', '&szlig;', '&ntilde;', '&Ntilde;',
        '&yuml;', '&Yuml;', '&Acirc;', '&acirc;', '&Ecirc;', '&ecirc;', '&Icirc;', '&icirc;', '&Ocirc;', '&ocirc;',
        '&Ucirc;', '&ucirc;'
    ];
    utf8_map TEXT[] := ARRAY[
        '&', '<', '>', '"', '''', '''', 'å', 'Å', 'æ', 'Æ',
        'ø', 'Ø', 'ç', 'Ç', 'ä', 'Ä', 'ë', 'Ë',
        'ï', 'Ï', 'ö', 'Ö', 'ü', 'Ü', 'ß', 'ñ', 'Ñ',
        'ÿ', 'Ÿ', 'Â', 'â', 'Ê', 'ê', 'Î', 'î', 'Ô', 'ô',
        'Û', 'û'
    ];
    i INTEGER;
BEGIN
    FOR i IN 1..array_length(entity_map, 1) LOOP
        input_text := REPLACE(input_text, entity_map[i], utf8_map[i]);
    END LOOP;
    
    RETURN input_text;
END;
$$ LANGUAGE plpgsql;

UPDATE sightings SET report_text = decode_html_entities(report_text);
UPDATE sightings SET location_text = decode_html_entities(report_text);

UPDATE sightings SET report_text = regexp_replace(report_text, '&#39', '''', 'g');
UPDATE sightings SET report_text = regexp_replace(report_text, '&#9;', ' ', 'g');
UPDATE sightings SET report_text = regexp_replace(report_text, '&#44', ', ', 'g');
UPDATE sightings SET report_text = regexp_replace(report_text, '&#160;', ', ', 'g');
UPDATE sightings SET report_text = regexp_replace(report_text, '&#180;', '''', 'g');