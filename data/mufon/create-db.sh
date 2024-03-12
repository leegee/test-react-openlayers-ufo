#!/usr/bin/env bash

# Gets a windows path for kaggle_scrubbed - replace this if you can.
PWD=$(pwd)
DRIVE_LC=$(echo "$PWD" | cut -c 2)
DRIVE_UC=$(echo "$PWD" | cut -c 2 | tr '[:lower:]' '[:upper:]')
PWD_WIN=$(echo "$PWD" | sed "s|^/$DRIVE_LC/|$DRIVE_UC:\\\\|")
PWD_WIN=$(echo "$PWD_WIN" | tr '/' '\\')
INPUT_CSV="$PWD_WIN\\kaggle_scrubbed.csv"

echo $INPUT_CSV


# psql -c "DROP DATABASE IF EXISTS ufo"
# psql -c "CREATE DATABASE ufo;"

psql -d ufo < schema.sql
psql -d ufo -c "COPY sightings FROM '$INPUT_CSV' WITH (FORMAT CSV, HEADER);"
psql -d ufo < update.sql