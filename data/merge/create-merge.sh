#!/usr/bin/env bash
set -e

pg_dump -d norge -t sightings -a --column-inserts  > sightings_norge.sql
pg_dump -d mufon -t sightings -a --column-inserts  > sightings_mufon.sql

# psql -c "DROP DATABASE IF EXISTS ufo";
# psql -c "CREATE DATABASE ufo";
# psql -c "DROP TABLE dmz; DROP TABLE dma; DROP TABLE dpa; DROP TABLE mains; DROP TABLE users;"

echo "Load scheme";
psql -d ufo < scheme.sql

echo "Norge to CSV";
psql -d norge -c "
COPY (
    SELECT datetime, state, country, duration_seconds, report_text, source, point, location_text, address, colour, rgb, shape
    FROM sightings
) TO '/norge.csv' WITH CSV HEADER;
";

echo "Mufon to CSV";
psql -d mufon -c "
COPY (
    SELECT datetime, state, country, duration_seconds,  report_text, source, point, location_text, address, shape
    FROM sightings
) TO '/mufon.csv' WITH CSV HEADER;
";

echo "Norge CSV to merge";
psql -d ufo -c "
COPY sightings (datetime, state, country, duration_seconds, report_text, source, point, location_text, address, colour, rgb, shape)
FROM '/norge.csv' WITH CSV HEADER;
";

echo "Mufon CSV to merge";
psql -d ufo -c "
COPY sightings (datetime, state, country, duration_seconds, report_text, source, point, location_text, address, shape)
FROM '/mufon.csv' WITH CSV HEADER;
";

# pg_dump -d ufo < update.sql

pg_dump -d ufo -t sightings -a --column-inserts  > ufo-combined.sql
