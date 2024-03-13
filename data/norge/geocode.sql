-- Add columns for latitude, longitude, and point geometry to the sightings table
ALTER TABLE sightings
    ADD COLUMN latitude DOUBLE PRECISION,
    ADD COLUMN longitude DOUBLE PRECISION,
    ADD COLUMN geom GEOGRAPHY(POINT, 4326);

-- Geocode the locations and populate the new columns
UPDATE sightings
SET
    latitude = ST_X(geog::geometry),
    longitude = ST_Y(geog::geometry),
    geom = ST_SetSRID(ST_MakePoint(ST_X(ST_Transform(geom, 4326)), ST_Y(ST_Transform(geom, 4326))), 4326)
FROM (
    -- Subquery to geocode each location description
    SELECT
        id,
        ST_GeogFromText(
            'SRID=4326;POINT(' || ST_X(ST_Transform(geom, 4326)) || ' ' || ST_Y(ST_Transform(geom, 4326)) || ')'
        ) AS geog
    FROM (
        -- Your existing sightings table containing location descriptions
        SELECT DISTINCT id, observasjonssted AS location_description, geom
        FROM sightings
    ) AS subquery
) AS subquery2
WHERE sightings.id = subquery2.id;

