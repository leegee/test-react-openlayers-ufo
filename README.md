# Combined Mufon/Norwegian UFO Database

This is a Typescript monorepo to host and expose UFO sighting data through a world map.


* UFO from Norge UFO and MUFON
* npm Typescript Monorepo
* OpenLayers 9
* React (hooks)
* Redux Toolkit 
* ag-grid
* Jest (switching to vitest)
* Vite 
* PWA with local map caching
* `ag-grid`
* PostGIS
* Koa
* Serverless functions
* Vercel serverless functions
* Text search
* Date-range search
* CSV downloads
* Optional server-side clustering

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

## Environment Variables

| Name                         | Default                 | Vercel default | Description                  |
|------------------------------|-------------------------| ---------------|------------------------------|
| UFO_DATABASE                 | `ufo`                   |                | Name of the database         |
| VITE_API_URL                 | `http://localhost:3000` | `VERCEL_URL`   | The Node.js API host         |
| PGHOST POSTGRES_HOST         | `localhost`             |                | The PostGIS host machine     |
| PGPORT POSTGRES_PORT         | `5432`                  |                | The PostGIS host port        |
| PGUSER POSTGRES_USER         | `postgres`              |                | PostGIS user name            |
| PGPASSWORD POSTGRES_PASSWORD | 'password'              | `POSTGRES_URL` | PostGIS URL from Verce       |

Vercel-specific values are set in the `vercel.config` file.

Vercel does not require  the `PG*` values.

## Synopsis

```bash
  psql -c 'CREATE DATABASE ${UFO_DATABASE}'
  psql -d ${UFO_DATABASE} < data/merged/ufo-combined.sql
  npm install
  npm run
  npm start

  # For production
  npm run build -ws
  # Or
  turbo build
```

## Description

This [Vite](https://vitejs.dev/)-bundled Typescript React app uses [Redux Toolkit](https://redux-toolkit.js.org/) to drive the state-based display and search of a [PostGIS](http://postgis.net/documentation/getting_started/install_windows/) database displayed on an [OpenLayers](https://openlayers.org/) map served by Koa or Vercel

Data is fectched for whatever region is visible, and filtered by search terms entered at the top of the window. 
If zoomed out by a configurable amount, the server clusters the points that represent sightings.

* [Pre-compiled PostGIS for 64-bit Windows](https://download.osgeo.org/postgis/windows/pg11/postgis-bundle-pg11x64-setup-3.3.3-1.exe).

## Feedback, pull requests

Please fix anything you can or suggest a better way of doing things.

## Limitations

* The Muffon database reports are truncated for legal reasons: apparently they do not wish to share full reports.
* Much of the Norge UFO data is yet to be processed. Any advice on reading the schema much appreciated.
* The map's minimum zoom level is set to avoid over-taxing the server and the client: hopefully will find time to produce density maps for such zoom levels.
* The heatmap may be slow, so perhaps write a custom loader to load a CSV

## Technical

### Client State

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

### The Current State of the data

#### UFO Norge

Locations of sightings were semi-manually geocoded from the locations given in the original MS Access database, which was converted to both Postgres and MySQL by a trial version of [Exportizer Enterprise](https://www.vlsoftware.net/exportizer/). The [data/norge/](data/norge/) directory contains those dumps, as well as scripts used to restore relations between the tables, convert the column names to English (since we hope to add Swedish and other data too), as well as cleaning dates and some other values.

Some effort has been put into massaging dates into usable state (`197?-13-31` was no use), as well as to geocode the sighting locations to gain latitude and longitude to plot.

As far as I can tell today, table relations (missing in the MDB dump) have been restored.

However, there are still lots of entries such as:

    Hvor befant de dem(4,1,1)	  false
    Hvor befant de dem(4,1,2)	  false

I've had to rename these as part of the move to MYSQL. Perhaps they relate to the `hovedtabell querybaerum` table?

#### MUFON

Some kind soul has done most of the above for the [MUFON dataset](data\mufon\datapackage.info.json) avaiable through Kaggle. I think this is the same as [on GitHub](https://github.com/planetsig/ufo-reports): sadly the text of the report is abridged to one line.

See [./data/mufon/](./data/mufon/) for the ingestion script. The data is not as verbose, but does cover quite a large area. The text had some HTML entities good and bad, which are tidied by the SQL ingestion scripts.

MUFON has much less detail, but much more data.

## Overview

![Flowchart](docs/images/arch-flowchart.png)

## Vercel Hosting

See `turbo.json` and `vercel.json`.

## Caveats

`bun` does not support `-w` or `--workspace`, so run scripts sadly use `npm`/`turbo`.

## Todo:

* Tighten linting.
* Tests.
* Logger transports/etc
* Initialise with map extent rather than center
* Use `class-validator` when it supports a modern Node version.

## Vercel/Turbo Notes

Vercel silently strips `devDependency` entries unless `NODE_ENV` is set to `developemnt` (or at least not set to `production`); `.npmrc` with `workspaces=true` is termianl.


