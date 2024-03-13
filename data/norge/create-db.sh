#!/usr/bin/env bash

export PGHOST=localhost
export PGPASSWORD=password
export PGPORT=5432
export PGUSER=postgres

# psql -c "DROP DATABASE IF EXISTS norge"
# psql -c "CREATE DATABASE norge"

# for file in mdb-export/*.sql; do
#     echo $file
#     psql -d norge < "$file"
# done

psql -d norge < update.sql

psql -d norge < geocode.sql