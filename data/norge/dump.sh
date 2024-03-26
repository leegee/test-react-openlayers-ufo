#!/usr/bin/env bash
set -e

export DUMP_DIR=./pg-dump

cd ${DUMP_DIR}

shopt -s nullglob
files=(*.sql*)
if [[ ${#files[@]} -gt 0 ]]; then
    rm *.sql*
fi

pg_dump -d norge | split -b 50m - norge_part.sql


# For MySQL: all good up until the need to convert the columns.
#
# export PROJ_LIB=/c/OSGeo4W/share/proj/;

# Dump postgis for ogr
# rm output_shapefile.*
# pgsql2shp -f output_shapefile -h localhost -u ${PGUSER} norge "SELECT * FROM sightings"

# Create a db
# mysql -h localhost -u ${MYSQL_USER} -p -e "CREATE DATABASE IF NOT EXISTS norge"

# Convert for mysql
# ogr2ogr -f "MySQL" MySQL:${UFO_DATABASE},user=${MYSQL_USER},password=${MYSQL_PASSWORD} output_shapefile.shp -lco GEOMETRY_NAME=point -lco OVERWRITE=YES -lco LAUNDER=NO

