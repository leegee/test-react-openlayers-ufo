#!/usr/bin/env bash

# all.csv was a concatination of sightings.location_text returned for the geocoding service,
# all-fewer-cols.csv is all.csv with most columns dropped.


# Gets a windows path for kaggle_scrubbed - replace this if you can.
PWD=$(pwd)
DRIVE_LC=$(echo "$PWD" | cut -c 2)
DRIVE_UC=$(echo "$PWD" | cut -c 2 | tr '[:lower:]' '[:upper:]')
PWD_WIN=$(echo "$PWD" | sed "s|^/$DRIVE_LC/|$DRIVE_UC:\\\\|")
PWD_WIN=$(echo "$PWD_WIN" | tr '/' '\\')
INPUT_CSV="$PWD_WIN\\all-fewer-cols.csv"

echo $INPUT_CSV


CREATE_TEMP_TABLE_SQL=$(cat <<-SQL
    CREATE TABLE temporary_table (
        original_address VARCHAR,
        lat DOUBLE PRECISION,
        lon DOUBLE PRECISION,
        formatted VARCHAR,
        postcode VARCHAR,
        county VARCHAR
    );
SQL
)

psql -d norge -c "${CREATE_TEMP_TABLE_SQL}"

psql -d norge -c "COPY temporary_table FROM '${INPUT_CSV}' WITH (FORMAT CSV, HEADER, ENCODING 'UTF-8');"

# Update latitude, longitude, and address in sightings table
psql -d norge -c "UPDATE sightings AS s
                SET latitude = c.lat,
                    longitude = c.lon,
                    address = c.formatted
                FROM temporary_table AS c
                WHERE s.location_text = c.original_address;";

psql -d norge -c "DROP TABLE temporary_table;";

psql -d norge -c "UPDATE sightings SET point = ST_Transform(ST_SetSRID(ST_MakePoint(longitude, latitude), 4326), 3857)"

