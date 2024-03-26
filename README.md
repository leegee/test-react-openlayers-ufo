# Norwegian UFO Database

Work in progress.

* npm Monorepo
* Typescript 
* Koa
* React (hooks)
* Redux Toolkit 
* Jest
* Vite 
* OpenLayers 9
* PostGIS
* UFOs

## Synopsis

```bash
  # After installing the DB and editing the config:
  npm install

  # Either
  npm run dev:api &
  npm run dev:client

  # Or to do both via 'concurrently':
  npm start
```

## Description

* Server-side clustering
* Text search
* Date-range search
* CSV downloads

This [Vite](https://vitejs.dev/)-bundled Typescript React app uses [Redux Toolkit](https://redux-toolkit.js.org/) to drive the state-based display and search of an [OpenLayers](https://openlayers.org/) map.

Data is fectched for whatever region is visible, and filtered by search terms entered at the top of the window. 
If zoomed out by a configurable amount, the server clusters the points that represent sightings.

Locations of sightings were semi-manually geocoded from the locations given in the original MS Access database, which was converted to both Postgres and MySQL by a trial version of [Exportizer Enterprise](https://www.vlsoftware.net/exportizer/). The [data/norge/](data/norge/) directory contains those dumps, as well as scripts used to restore relations between the tables, convert the column names to English (since we hope to add Swedish and other data too), as well as cleaning dates and some other values.

All state is controlled by the Redux 'slices':

- `gui`: the state of the interface
- `details`: the details of a single report
- `map`: everything needed to query and render results.

## Installing and Accessing the DB

There is a dump of the current state of the PostGIS database: [./data/norge/pg-dump/](./data/norge/pg-dump/) - install the usual way with `psql < dump.sh`.

Configuration access options in hard-coded  in [the global config](./packages/config/): PG access tries the usual PG environment varirables, but of course this should (and will) be upgraded to use `.env` files.

Soem work has been done to port to MySQL, but the big `update.sql` has yet to be tackled.

## State of the data

Some effort has been put into massaging dates into usable state (`197?-13-31` was no use), as well as to geocode the sighting locations to gain latitude and longitude to plot.

As far as I can tell today, table relations (missing in the MDB dump) have been restored.

However, there are still lots of entries such as:

    Hvor befant de dem(4,1,1)	  false
    Hvor befant de dem(4,1,2)	  false

I've had to rename these as part of the move to MYSQL. Perhaps they relate to the `hovedtabell querybaerum` table?

## Feedback, pull requests

Please fix anything you can or suggest a better way of doing things.

## Todo:

* Sort order toggling (2h) - atm sorting is by score if the is one, otherwise by date, but dates need work
* Clean the start time column and add to the dateitme column: (which was `Obs  startet kl (32)` but is not `start_time`).
* Tests.
* Logger transports/etc
* Store bounds and filter settings in the URI (4h)
* Highlight on map feature chosen in report or click on
* Initialise with map extent rather than center
* Server should infer cluster size (`cluster_eps`) from zoom level.

## DB

Using PostGIS, storing data in EPSG:3857 for speed, with the API accepting EPSG:4326/WGS84 for legibility.

## Pics

Points are clustered when zoomed out:

![Screenshot](./docs/images/Screenshot%202024-03-17%20181056.png)

One can toggle between three different base maps:

![Screenshot](./docs/images/Screenshot%202024-03-17%20202144.png)

Zoom in to clusters to view individual sightings, with a list of their reported dates and locations:

![Screenshot](./docs/images/Screenshot%202024-03-17%20181156.png)

![Screenshot](./docs/images/Screenshot%202024-03-17%20181241.png)

Search the visible area of the map for text that appears in the report (location, report text, more later):

![Screenshot](./docs/images/Screenshot%202024-03-17%20202028.png)

After making a search query, points are displayed.

Whenever points are displayed, the date range input is populated with the minimum and maximum values of the visible points:

![Date range input screenshot](./docs/images/date-range.png)

The table on the left links to the full report, which will in time link to all the available data:

![Screenshot](./docs/images/Screenshot%202024-03-17%20181317.png)

Clicking the date range when viewing points shows a histogram:
![Histogram](./docs/images/histogram.png)

.