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

![Screenshot](./docs/images/Screenshot%202024-03-14%20155152.png)

## Todo:

Currently we send everything in the bounding box and cluster on the client.

Probably want to cluster on the server, so as not to overwhelm mobiles/etc.

* Tests.
* Logger transports/etc
* Decide on a default sort of results when no filters set
* Sort order toggling (2h)
* Enable switching locale from `no` to `en` and back (1h)
* Enable switching base map (1h)
* On-screen info about points as tooltip? (4h)
* Store bounds and filter settings in the URI (4h)
* Share common-type of request/response (1h)

* Expose more data: shape, colour, direction, etc
* Extract more config options

## DB

Using PostGIS, storing data in EPSG:3857 for speed, with the API accepting EPSG:4326/WGS84 for legibility.

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
