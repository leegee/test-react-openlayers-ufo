// src/lib/TilesLayer.ts

import TileLayer from 'ol/layer/VectorTile';
import { VectorTile } from 'ol/source';
import MVT from 'ol/format/MVT';
import { Style, Fill, Stroke, Circle } from 'ol/style';
import config from '@ufo-monorepo/config';
import { FeatureLike } from 'ol/Feature';

// Tiles are not displayed, dunno why, probably style...?

const sightingsStyleFunction = (_feature: FeatureLike) => {
    return new Style({
        image: new Circle({
            radius: 116,
            fill: new Fill({
                color: 'yellow',
            }),
            stroke: new Stroke({
                color: 'rgba(255, 255, 255, 0.8)',
                width: 2,
            }),
        }),
    });
};

export const tilesLayer = new TileLayer({
    style: sightingsStyleFunction,
    source: new VectorTile({
        format: new MVT(),
        url: `${config.api.url}${config.api.endpoints.tiles}/{z}/{x}/{y}.mvt`,
        tileSize: 256,
        maxZoom: 19,
    }),
});

