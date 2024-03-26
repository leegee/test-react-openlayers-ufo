#!/usr/bin/env bash

export MYSQL_USER=root
export MYSQL_PASSWORD=root
export MYSQL_PORT=3306
export MYSQL_HOST=localhost


mysql -u ${MYSQL_USER} -p${MYSQL_PASSWORD} -e "DROP DATABASE IF EXISTS norge" 
mysql -u ${MYSQL_USER} -p${MYSQL_PASSWORD} -e "CREATE DATABASE norge CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci" 

for file in mdb-to-mysql/*.sql; do
    echo $file
    mysql -u ${MYSQL_USER} -p${MYSQL_PASSWORD} norge < "$file"
done

# mysql -u ${MYSQL_USER} -p norge < update.sql

# bash geocoding/ingest_all_csv.sh

# mysql -u ${MYSQL_USER} -p norge < post-geocode.sql


