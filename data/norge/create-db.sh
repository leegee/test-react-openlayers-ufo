#!/usr/bin/env bash

export PGHOST=localhost
export PGPASSWORD=password
export PGPORT=5432
export PGUSER=postgres

psql -c "DROP DATABASE IF EXISTS norge"
# psql -c "CREATE DATABASE norge"
psql -c "CREATE DATABASE norge WITH ENCODING = 'UTF8'"

for file in mdb-to-postgis/*.sql; do
    echo $file
    psql -d norge < "$file"
done

psql -d norge < update.sql

bash geocoding/ingest_all_csv.sh

psql -d norge < post-geocode.sql


