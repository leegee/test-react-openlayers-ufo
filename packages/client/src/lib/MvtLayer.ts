// @see https://openlayers.org/workshop/en/webgl/points.html

import { VectorTile as VectorTileSource } from 'ol/source';
import { VectorTile as VectorTileLayer } from 'ol/layer';
import { MVT } from 'ol/format';
import type { TileCoord } from 'ol/tilecoord';
import type { Dispatch, UnknownAction } from '@reduxjs/toolkit';

import config from '@ufo-monorepo-test/config/src';
import { store } from "../redux/store";
import { selectMvtQueryString, setLoading, setLoadingPc } from '../redux/mapSlice';
import { sightingsStyleFunction } from './sightings-styles';
import { Feature, VectorTile } from 'ol';
import { FeatureLike } from 'ol/Feature';

const customTileUrlFunction = (tileCoord: TileCoord) => {
    const z = tileCoord[0];
    const x = tileCoord[1];
    const y = tileCoord[2];
    const queryString: string | undefined = selectMvtQueryString(store.getState().map);
    return `${config.api.host}:${config.api.port}${config.api.endopoints.pointsMvt.url}/${z}/${x}/${y}.mvt?` + (queryString || '');
};

// Create VectorTileSource
const mvtSource = new VectorTileSource({
    format: new MVT(),
    // tileGrid: createXYZ({ maxZoom: 19 }),
    tileUrlFunction: customTileUrlFunction,
});

mvtSource.on('tileloadend', function (event) {
    const features = (event.tile as VectorTile).getFeatures();
    const allProperties: any[] = [];
    features.forEach((feature: FeatureLike) => {
        const properties = feature.getProperties();
        allProperties.push(properties);
    });
    console.log('Feature properties:', allProperties);
});


export function useProgressBar(dispatch: Dispatch<UnknownAction>) {
    let loading = 0;
    let loaded = 0;

    const addLoading = () => {
        ++loading;
        updateProgress();
    };

    const addLoaded = () => {
        ++loaded;
        updateProgress();
    };

    const updateProgress = () => {
        const width = (loaded / loading) * 100;
        dispatch(setLoadingPc(width));
    }

    mvtSource.on('tileloadstart', () => addLoading());
    mvtSource.on(['tileloadend', 'tileloaderror'], () => addLoaded());

    return {
        mvtLoadStart: () => {
            loading = 0;
            loaded = 0;
            dispatch(setLoading(true));
        },
        mvtLoadEnd: () => {
            loading = 0;
            loaded = 0;
            dispatch(setLoading(false));
        }
    }
}


export const mvtLayer = new VectorTileLayer({
    declutter: true,
    source: mvtSource,
    renderMode: 'vector',
    style: sightingsStyleFunction
});
