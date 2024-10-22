# Combined Mufon/Norwegian UFO Database

* UFOs
* npm Typescript Monorepo (works with bun)
* OpenLayers 9
* React (hooks)
* Redux Toolkit 
* ag-grid
* Jest
* Vite 
* `ag-grid`
* PostGIS
* Koa
* Serverless functions
* Text search
* Date-range search
* CSV downloads
* Optional server-side clustering

## Environment Variables

| Name                  | Default            | Description              |
|-----------------------|--------------------| ------------------------ |
| PGHOST                | `localhost`        | The PostGIS host machine |
| PGPORT                | `5432`             | The PostGIS host port    |
| PGUSER                | `postgres`         | PostGIS user name        |
| PGPASSWORD            | `password`         | PostGIS passphrase       |
| UFO_DATABASE          | `ufo`              | Name of the database     |
| VITE_HTTP_HOST        | `http://localhost` | The Node.js API host     |
| VITE_HTTP_PORT        | `8080`             | The Node.js API port, 3000 for Vercel local dev |
| VITE_ENDPOINT_SEARCH  | `/search`          | Vercel SF use: 'api/search' |
| VITE_ENDPOINT_DETAILS | `/details`         | Vercel SE use: `api/details` |

Vercel-specific values are set in the `vercel.config` file.

## Synopsis

```bash
  psql -c 'CREATE DATABASE ${UFO_DATABASE}'
  psql -d ${UFO_DATABASE} < data/merged/ufo-combined.sql
  bun install
  bun run
  bun start

  # For production
  bun run build -ws
```

After bulding you will be left with: the output of the Vite bundler to be hosted by your HTTP server; a Node server script, to host via pm2/etc; serverless functions compatible with Vercel.

## Description

This [Vite](https://vitejs.dev/)-bundled Typescript React app uses [Redux Toolkit](https://redux-toolkit.js.org/) to drive the state-based display and search of an [OpenLayers](https://openlayers.org/) map served by [PostGIS](http://postgis.net/documentation/getting_started/install_windows/) - probably [this version for 64-bit Windows](https://download.osgeo.org/postgis/windows/pg11/postgis-bundle-pg11x64-setup-3.3.3-1.exe).

Data is fectched for whatever region is visible, and filtered by search terms entered at the top of the window. 
If zoomed out by a configurable amount, the server clusters the points that represent sightings.

## Feedback, pull requests

Please fix anything you can or suggest a better way of doing things.

## Limitations

* The Muffon database reports are truncated for legal reasons: apparently they do not wish to share full reports.
* Much of the Norge UFO data is yet to be processed. Any advice on reading the schema much appreciated.
* The map's minimum zoom level is set to avoid over-taxing the server and the client: hopefully will find time to produce density maps for such zoom levels.
* The heatmap may be slow, so perhaps write a custom loader to load a CSV

## User Journey

Sightings are clustered as a heatmap when zoomed out:

![Initial view, theme a](./docs/images/init-1.png)
![Initial view, theme b](./docs/images/init-2.png)
![Initial view, theme c](./docs/images/init-3.png)

When the map is zoomed in or searched, sightings are displayed on the map and in an abbreviated table:

![Sightings](./docs/images/search-text.png)

Selecting a point highlights it:

![Highlights](./docs/images/selection.png)

Clicking the arrow in the head of the abbreviated table opens the full table:

![Report](./docs/images/wide-report.png)

Both tables give access to the details of the full report:

![Details](./docs/images/details.png)

At any time, the visible sightings can be downloaded as a CSV:

![Download](./docs/images/save-csv.png)

![CSV](./docs/images/csv.png)

When viewing points, clicking the date range calendar icon  shows a histogram of the sightings by year:

![Histogram](./docs/images/histogram.png)

## Technical

All state is controlled by the Redux 'slices':

- `gui`: the state of the interface
- `details`: the details of a single report
- `map`: everything needed to query and render results.

The service layer is provided by Koa for simplicity, but could use any Express-type framework that can import routes/middleware.

### Installing and Accessing the DB

There is a dump of the current state of the PostGIS databases: see [./data](./data)

Configuration of access options via env vars, defaults hard-coded in [the global config](./packages/config/): PG access tries the usual PG environment varirables, but of course this should (and will) be upgraded to use `.env` files.

Some work has been done to port to MySQL, but the big `update.sql` has yet to be tackled.

Location data is stored in EPSG:3857 for speed, with the API accepting EPSG:4326/WGS84 for legibility.

## The Current State of the data

### UFO Norge

Locations of sightings were semi-manually geocoded from the locations given in the original MS Access database, which was converted to both Postgres and MySQL by a trial version of [Exportizer Enterprise](https://www.vlsoftware.net/exportizer/). The [data/norge/](data/norge/) directory contains those dumps, as well as scripts used to restore relations between the tables, convert the column names to English (since we hope to add Swedish and other data too), as well as cleaning dates and some other values.

Some effort has been put into massaging dates into usable state (`197?-13-31` was no use), as well as to geocode the sighting locations to gain latitude and longitude to plot.

As far as I can tell today, table relations (missing in the MDB dump) have been restored.

However, there are still lots of entries such as:

    Hvor befant de dem(4,1,1)	  false
    Hvor befant de dem(4,1,2)	  false

I've had to rename these as part of the move to MYSQL. Perhaps they relate to the `hovedtabell querybaerum` table?

### MUFON

Some kind soul has done most of the above for the [MUFON dataset](data\mufon\datapackage.info.json) avaiable through Kaggle. I think this is the same as [on GitHub](https://github.com/planetsig/ufo-reports): sadly the text of the report is abridged to one line.

See [./data/mufon/](./data/mufon/) for the ingestion script. The data is not as verbose, but does cover quite a large area. The text had some HTML entities good and bad, which are tidied by the SQL ingestion scripts.

MUFON has much less detail, but much more data.

## Overview

![Flowchart](docs/images/arch-flowchart.png)

## WIP

Vercel

## Todo:

* Tighten linting.
* Tests.
* Logger transports/etc
* Initialise with map extent rather than center
* Use `class-validator` when it supports a modern Node version.
