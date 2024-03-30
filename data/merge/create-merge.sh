#!/usr/bin/env bash
set -e

pg_dump -d norge -t sightings -a --column-inserts  > sightings_norge.sql
pg_dump -d mufon -t sightings -a --column-inserts  > sightings_mufon.sql

# psql -c "DROP DATABASE IF EXISTS ufo";
# psql -c "CREATE DATABASE ufo";

psql -d ufo < scheme.sql

psql -d norge -c "
COPY (
    SELECT datetime, state, country, report_text, source, point, location_text, address, colour, rgb, shape
    FROM sightings
) TO '/norge.csv' WITH CSV HEADER;
";

psql -d mufon -c "
COPY (
    SELECT datetime, state, country, report_text, source, point, location_text, address, shape
    FROM sightings
) TO '/mufon.csv' WITH CSV HEADER;
";

psql -d ufo -c "
COPY sightings (datetime, state, country, report_text, source, point, location_text, address, colour, rgb, shape)
FROM '/norge.csv' WITH CSV HEADER;
";

psql -d ufo -c "
COPY sightings (datetime, state, country, report_text, source, point, location_text, address, shape)
FROM '/mufon.csv' WITH CSV HEADER;
";

pg_dump -d ufo -t sightings -a --column-inserts  > ufo-combined.sql
