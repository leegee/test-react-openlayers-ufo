ALTER TABLE sightings 
  DROP COLUMN duration_hours_min,
  ALTER COLUMN date_posted TYPE DATE USING TO_DATE(date_posted, 'MM/DD/YYYY'),
  ALTER COLUMN datetime TYPE DATE USING TO_DATE(datetime, 'MM/DD/YYYY'),
  ADD COLUMN source VARCHAR(25) CHECK (source IN ('mufon-kaggle')),
  ADD COLUMN point GEOMETRY(POINT, 3857),
  ADD COLUMN location_text VARCHAR(255);

ALTER TABLE sightings RENAME COLUMN comments TO report_text;

ALTER TABLE sightings
  ALTER COLUMN latitude TYPE double precision USING latitude::double precision,
  ALTER COLUMN longitude TYPE double precision USING longitude::double precision;

UPDATE sightings 
  SET location_text = city || ' ' || state || ' ' || country;

UPDATE sightings
  SET duration_seconds = CAST(REGEXP_REPLACE(duration_seconds, '[^0-9.]', '', 'g') AS NUMERIC(10, 2));

-- UPDATE sightings
--   SET point = ST_Transform(
--     ST_SetSRID( ST_MakePoint(longitude::numeric, latitude::numeric)::geometry, 4326)::point,
--     3857
--   );

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
