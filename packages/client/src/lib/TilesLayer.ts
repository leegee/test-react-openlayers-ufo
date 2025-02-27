// import { bbox } from "ol/loadingstrategy";
// import GeoJSON from 'ol/format/GeoJSON';
// import VectorLayer from 'ol/layer/Vector';
// import VectorSource from 'ol/source/Vector';

// import type { UfoFeatureCollectionType } from '@ufo-monorepo/common-types';
// import { sightingsStyleFunction } from "./map-style";

import config from '@ufo-monorepo/config';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';

export const tilesLayer = new TileLayer({
    source: new XYZ({
        url: config.api.url + config.api.endpoints.tiles + '/{z}/{x}/{y}.mvt',
        maxZoom: 19,
        tileSize: 256,
        crossOrigin: 'anonymous'
    }),
});

