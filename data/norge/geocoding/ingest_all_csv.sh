#!/usr/bin/env bash

# all.csv was a concatination of sightings.location_text returned for the geocoding service,
# all-fewer-cols.csv is all.csv with most columns dropped.


# Gets a windows path for kaggle_scrubbed - replace this if you can.
CWD=$(dirname "$(readlink -f "$0")")
DRIVE_LC=$(echo "$CWD" | cut -c 2)
DRIVE_UC=$(echo "$CWD" | cut -c 2 | tr '[:lower:]' '[:upper:]')
CWD_WIN=$(echo "$CWD" | sed "s|^/$DRIVE_LC/|$DRIVE_UC:\\\\|")
CWD_WIN=$(echo "$CWD_WIN" | tr '/' '\\')
INPUT_CSV="$CWD_WIN\\all-fewer-cols.csv"

echo $INPUT_CSV

if [ ! -f "$INPUT_CSV" ]; then
    echo "Error: File '$INPUT_CSV' not found."
    exit 1
fi

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

psql -d norge -c "
    ALTER TABLE sightings
        ADD COLUMN latitude DOUBLE PRECISION,
        ADD COLUMN longitude DOUBLE PRECISION,
        ADD COLUMN point GEOMETRY(POINT, 3857),
        ADD COLUMN address VARCHAR(255);";

psql -d norge -c "UPDATE sightings AS s
                SET latitude = c.lat,
                    longitude = c.lon,
                    address = c.formatted
                FROM temporary_table AS c
                WHERE s.location_text = c.original_address;";

psql -d norge -c "DROP TABLE temporary_table;";

