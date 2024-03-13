COPY (
    SELECT DISTINCT location_text || ', Norway' AS location_with_country
    FROM sightings
    WHERE location_text IS NOT NULL AND location_text <> ''
    ORDER BY location_with_country ASC
) TO 'S:\\src\\ufo-monorepo\\data\\norge\\export_locations2.csv' ENCODING 'UTF-8';

-- Results posted to https://www.geoapify.com/tools/geocoding-online
