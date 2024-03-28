import React, { type Dispatch, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import debounce from 'debounce';
import { Map, type MapBrowserEvent, View } from 'ol';
import { fromLonLat, transformExtent } from 'ol/proj';
import { easeOut } from 'ol/easing';
import type TileLayer from 'ol/layer/Tile';
import type VectorTileLayer from 'ol/layer/VectorTile';
import type TileSource from 'ol/source/Tile';
import { type UnknownAction } from '@reduxjs/toolkit';

import config from '@ufo-monorepo-test/config/src';
import { RootState } from './redux/store';
import { setMapParams, selectBasemapSource, resetDates, setUpdateMap } from './redux/mapSlice';
import { setSelectionId } from './redux/guiSlice';
import Tooltip from './Map/Tooltip';
import labelsLayer from './lib/map-base-layer/layer-labels';
import baseLayerDark from './lib/map-base-layer/layer-dark';
import baseLayerLight from './lib/map-base-layer/layer-osm';
import baseLayerGeo from './lib/map-base-layer/layer-geo';
import { mvtLayer, useProgressBar } from './lib/MvtLayer';
import ThemeToggleButton from './Map/ThemeToggleButton';
import LocaleManager from './LocaleManager';

import 'ol/ol.css';
import './Map.css';

export type MapBaseLayerKeyType = 'dark' | 'light' | 'geo';
export type MapLayerKeyType = 'all';
export type MapBaseLayersType = {
    [key in MapBaseLayerKeyType]: TileLayer<TileSource>;
}

const mapBaseLayers: MapBaseLayersType = {
    dark: baseLayerDark,
    light: baseLayerLight,
    geo: baseLayerGeo,
};

function setTheme(baseLayerName: MapBaseLayerKeyType) {
    for (const l of Object.keys(mapBaseLayers)) {
        mapBaseLayers[l as MapBaseLayerKeyType].setVisible(l === baseLayerName);
    }
}

// Zoom to the cluster or point on click
function clickMap(e: MapBrowserEvent<any>, map: Map, dispatch: Dispatch<UnknownAction>) {
    let didOneFeature = false;
    map.forEachFeatureAtPixel(e.pixel, function (clickedFeature): void {
        if ( !didOneFeature) {
            // Clicked a cluster
            if (clickedFeature.get('cluster_id')) {
                dispatch(setSelectionId(undefined));
                map.getView().animate({
                    center: e.coordinate,
                    zoom: config.zoomLevelForPoints,
                    duration: 500,
                    easing: easeOut
                });
            }
            else {
                // Clicked a point
                const id = clickedFeature.get('id') as string;
                dispatch(resetDates());
                dispatch(setSelectionId(id));
                // showPoint(id);
            }
            didOneFeature = true;
        }
    });
}

const OpenLayersMap: React.FC = () => {
    const dispatch = useDispatch();
    const { center, zoom, updateMap } = useSelector((state: RootState) => state.map);
    const { selectionId, panel: panelState } = useSelector((state: RootState) => state.gui);
    const basemapSource: MapBaseLayerKeyType = useSelector(selectBasemapSource);
    const mapElementRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<Map | null>(null);
    const mvtLayerRef = useRef<VectorTileLayer | null>(null);

    const handleMoveEnd = () => {
        if (!mapRef.current) return;
        const center = mapRef.current.getView().getCenter() as [number, number];
        const zoom = mapRef.current.getView().getZoom() ?? 0;
        const extent = mapRef.current.getView().calculateExtent(mapRef.current.getSize());
        const bounds = transformExtent(extent, 'EPSG:3857', 'EPSG:4326') as [number, number, number, number];
        dispatch(setMapParams({ center, zoom, bounds }));
    };

    useEffect(() => {
        setTheme(basemapSource);
    }, [basemapSource]);

    // Re-render visible layers when user selects a point to show highlighted selection
    useEffect(() => {
        if (mvtLayerRef.current && mvtLayerRef.current.getVisible()) {
            const source = mvtLayerRef.current.getSource();
            source?.changed();
        }
    }, [selectionId]);

    useEffect(() => {
        let map: Map;

        if (mapElementRef.current) {
            map = new Map({
                target: mapElementRef.current,
                view: new View({
                    center: fromLonLat(center),
                    zoom,
                }),
                layers: [
                    ...Object.values(mapBaseLayers),
                    labelsLayer,
                    mvtLayer
                ],
            });

            mapRef.current = map;

            map.on('moveend', debounce(handleMoveEnd, config.gui.debounce, { immediate: true }));
            map.on('click', debounce((e) => clickMap(e, map, dispatch), config.gui.debounce, { immediate: true }));

            // eslint-disable-next-line react-hooks/rules-of-hooks
            const { mvtLayerLoadStart, mvtLayerLoadEnd } = useProgressBar(dispatch);
            map.on('loadstart', () => {
                document.body.classList.add('loading');
                mvtLayerLoadStart();
            });
            map.on('loadend', () => {
                document.body.classList.remove('loading');
                mvtLayerLoadEnd();
            });
        }

        return () => map.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!mapElementRef.current || !mvtLayerRef.current) return;
        if (updateMap) {
            mvtLayerRef.current.getSource()?.refresh();
            dispatch(setUpdateMap(false));
        }
    }, [updateMap, dispatch]);

    useEffect(() => {
        console.log('zoom', zoom, config.zoomLevelForPoints);
    }, [zoom])

    // NB The size of the map is controlled by the state of the panel (state.gui.panel, locally aka panelState)
    return (
        <section id='map' className={'panel-is-' + panelState} ref={mapElementRef} >
            <div className='map-ctrls'>
                <ThemeToggleButton />
                <LocaleManager />
            </div>
            {mapRef.current && <Tooltip map={mapRef.current} />}
        </section>
    );
};



export default OpenLayersMap;

