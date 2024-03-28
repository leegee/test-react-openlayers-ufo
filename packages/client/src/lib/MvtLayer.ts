// @see https://openlayers.org/workshop/en/webgl/points.html

import { VectorTile as VectorTileSource } from 'ol/source';
import { VectorTile as VectorTileLayer } from 'ol/layer';
import { MVT } from 'ol/format';
import type { TileCoord } from 'ol/tilecoord';
import type { Dispatch, UnknownAction } from '@reduxjs/toolkit';
import { VectorTile } from 'ol';

import config from '@ufo-monorepo-test/config/src';
import { store } from "../redux/store";
import { selectMvtQueryString, addPropretiesToFeatureCollection, setLoading, setLoadingPc, type UfoFeatureCollection, UfoJsonFeature, resetFeatureCollection, finaliseFeatureCollection } from '../redux/mapSlice';
import { sightingsStyleFunction } from './sightings-styles';

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
        mvtLayerLoadStart: () => {
            loading = 0;
            loaded = 0;
            dispatch(setLoading(true));
            dispatch(resetFeatureCollection());
        },
        mvtLayerLoadEnd: () => {
            loading = 0;
            loaded = 0;
            dispatch(setLoading(false));
            dispatch(finaliseFeatureCollection());
        }
    }
}


export function useMvtLayer(dispatch: Dispatch<UnknownAction>) {
    const mvtLayer = new VectorTileLayer({
        declutter: true,
        source: mvtSource,
        renderMode: 'vector',
        style: sightingsStyleFunction
    });

    mvtSource.on('tileloadend', function (event) {
        const features = (event.tile as VectorTile).getFeatures().map(feature => {
            return { properties: feature.getProperties() } as UfoJsonFeature
        });
        console.log('tileloadend:', event.tile, features);

        dispatch(addPropretiesToFeatureCollection(features));
    });

    return { mvtLayer, useProgressBar };
}
