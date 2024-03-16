#!/usr/bin/env bash

export DUMP_DIR=./pg-dump

cd ${DUMP_DIR}

rm *.sql*

pg_dump -d norge | split -b 50m - norge_part.sql
