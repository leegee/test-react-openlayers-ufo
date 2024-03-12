ALTER TABLE sightings 
  DROP COLUMN duration_hours_min,
  ALTER COLUMN date_posted TYPE DATE USING TO_DATE(date_posted, 'MM/DD/YYYY'),
  ALTER COLUMN datetime TYPE DATE USING TO_DATE(datetime, 'MM/DD/YYYY'),
  ADD COLUMN source VARCHAR(25) CHECK (source IN ('mufon-kaggle')),
  ADD COLUMN point_geom POINT;

UPDATE sightings
SET duration_seconds = CAST(REGEXP_REPLACE(duration_seconds, '[^0-9.]', '', 'g') AS NUMERIC(10, 2));

UPDATE sightings
SET latitude = CAST(REGEXP_REPLACE(latitude, '[^0-9\.\-]', '', 'g') AS NUMERIC(10, 6)),
    longitude = CAST(REGEXP_REPLACE(longitude, '[^0-9\.\-]', '', 'g') AS NUMERIC(10, 6));

UPDATE sightings
SET point_geom = ST_SetSRID(ST_MakePoint(longitude::numeric, latitude::numeric)::geometry, 4326)::point;

ALTER TABLE sightings 
  DROP COLUMN longitude,
  DROP COLUMN latitude;

CREATE INDEX ON sightings (datetime);
CREATE INDEX ON sightings (date_posted);
CREATE INDEX ON sightings USING GIST (point_geom);

-- Check the results
SELECT COUNT(*) AS total_in_table FROM sightings;

SELECT COUNT(*) AS no_lat_lng FROM sightings WHERE point_geom IS NULL;
