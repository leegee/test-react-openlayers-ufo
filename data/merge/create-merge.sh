#!/usr/bin/env bash
set -e

pg_dump -d norge -t sightings -a --column-inserts  > sightings_norge.sql
pg_dump -d mufon -t sightings -a --column-inserts  > sightings_mufon.sql


psql -c "DROP DATABASE IF EXISTS ufo";
psql -c "CREATE DATABASE ufo";

psql -d ufo < scheme.sql

psql -c "
INSERT INTO combined_sightings (datetime, date, state, country, report_text, source, point, location_text, address, colour)
SELECT datetime, date, state, country, report_text, source, point, location_text, address, colour
FROM norge.sightings;
";

psql -c "
INSERT INTO combined_sightings (datetime, date, state, country, report_text, source, point, location_text, address, colour)
SELECT datetime, date, state, country, report_text, source, point, location_text, address, colour
FROM mufon.sightings;
";
