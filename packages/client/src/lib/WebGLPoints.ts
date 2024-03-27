// @see https://openlayers.org/workshop/en/webgl/points.html

import config from '@ufo-monorepo-test/config/src';
import { VectorTile as VectorTileSource } from 'ol/source';
import { VectorTile as VectorTileLayer } from 'ol/layer';
import { MVT } from 'ol/format';
import { createXYZ } from 'ol/tilegrid';
import type { TileCoord } from 'ol/tilecoord';
import CircleStyle from 'ol/style/Circle';
import { Fill, Stroke, Style } from 'ol/style';

const customTileUrlFunction = (tileCoord: TileCoord) => {
    const z = tileCoord[0];
    const x = tileCoord[1];
    const y = tileCoord[2];
    const url = `${config.api.host}:${config.api.port}${config.api.endopoints.pointsMvt.url}/${z}/${x}/${y}.mvt?foo=bar`;
    console.log(url);
    return url;
};


// Create VectorTileSource
const mvtSource = new VectorTileSource({
    format: new MVT(),
    tileGrid: createXYZ({ maxZoom: 19 }),
    // url: `${config.api.host}:${config.api.port}${config.api.endopoints.pointsMvt.url}`,
    tileUrlFunction: customTileUrlFunction,
});


export const mvtLayer = new VectorTileLayer({
    declutter: true,
    source: mvtSource,
    renderMode: 'vector',
    style: new Style({
        image: new CircleStyle({
            radius: 5,
            fill: new Fill({ color: 'rgba(0, 255, 255, 0.5)' }),
            stroke: new Stroke({ color: 'rgba(0, 255, 255, 1)', width: 1 })
        })
    })
});
