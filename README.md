# npm Monorepo + React + Redux Toolkit + TypeScript + Vite + OpenLayers + PostGIS + UFOs.

WIP, just testing.

## Synopsis

  npm i
  npm run dev:api &
  npm run dev:client

## Description

A simple OpenLayers map to fetch and display data when the map is rendered, zoomed, or moved (ie on `moveend`), with a portable Koa data access layer.

Using Redux Toolkit's 'slices' to try and tame the horribly dated and ungainly Redux. I prefer Vue and Pinia, but....

Currently the master branch has server- and client-side clustering, but  the is also a slightly-outdate `no-clusters` branch.

See the `README`s in the sub-directories of `data/` for details of the MUFON and Norge UFO sighting data.

Data is fectched for whatever region is visible, and filtered by search terms entered at the top of the window.

## Todo:

Currently we send everything in the bounding box and cluster on the client.

Probably want to cluster on the server, so as not to overwhelm mobiles/etc.

* Sort order toggling (2h) - may as well be local
* Add to dateitme `Obs  startet kl (32)` (eg `19.45`)
* Link to full details
* Tests.
* Logger transports/etc
* Decide on a default sort of results when no filters set
* Enable switching locale from `no` to `en` and back (1h)
* Store bounds and filter settings in the URI (4h)
* Highlight on map feature chosen in report or click on
* Initialise with map extent rather than center
* Share common-type of request/response (1h)
* Server should infer cluster size (`cluster_eps`) from zoom level.
* Expose more data: 
  * shape, colour, direction, etc from lin columns
  * Include `Hvor lenge iakttok?(35)`

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

.

.

.

.

.

## Biolerplate Notices

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list
