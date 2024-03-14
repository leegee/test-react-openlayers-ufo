# npm Monorepo + React + Redux Toolkit + TypeScript + Vite + OpenLayers + PostGIS + UFOs.

WIP, just testing.

Using Redux Toolkit's 'slices' to try and tame the horribly dated and ungainly Redux.

A simple OpenLayers map to fetch and display data when the map is rendered, zoomed, or moved (ie on `moveend`), with a tiny Koa data access layer.

See the `README`s in the sub-directories of `data/` for details of the MUFON and Norge UFO sighting data.

![Screenshot](./docs/images/Screenshot%202024-03-14%20120826.png)

Todo:

* Expose more data: shape, colour, direction, etc
* Filter on all columns

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
