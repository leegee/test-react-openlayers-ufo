import React, { type Dispatch, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import debounce from 'debounce';
import { Map, type MapBrowserEvent, View } from 'ol';
import { fromLonLat, transformExtent } from 'ol/proj';
import { easeOut } from 'ol/easing';
import VectorSource from 'ol/source/Vector';
import TileLayer from 'ol/layer/Tile';
import type Layer from 'ol/layer/Layer';
import { type UnknownAction } from '@reduxjs/toolkit';

import config from '@ufo-monorepo-test/config/src';
import { RootState } from './redux/store';
import { setMapParams, selectBasemapSource, resetDates, setUpdateMap } from './redux/mapSlice';
import { setSelectionId } from './redux/guiSlice';
import { useFeatureHighlighting } from './Map/VectorLayerHighlight';
import Tooltip from './Map/Tooltip';
import labelsLayer from './lib/map-base-layer/layer-labels';
import baseLayerDark from './lib/map-base-layer/layer-dark';
import baseLayerLight from './lib/map-base-layer/layer-osm';
import baseLayerGeo from './lib/map-base-layer/layer-geo';
import { mvtLayer, useProgressBar } from './lib/Mvt';
import ThemeToggleButton from './Map/ThemeToggleButton';
import LocaleManager from './LocaleManager';

import 'ol/ol.css';
import './Map.css';

export type MapBaseLayerKeyType = 'dark' | 'light' | 'geo';
export type MapLayerKeyType = 'all';
export type MapBaseLayersType = {
    [key in MapBaseLayerKeyType]: Layer<VectorSource<any>> | TileLayer<any>;
}

type MapLayersType = {
    [key in MapLayerKeyType]: Layer;
}

const mapLayers: MapLayersType = {
    all: mvtLayer,
}

const mapBaseLayers: MapBaseLayersType = {
    dark: baseLayerDark,
    light: baseLayerLight,
    geo: baseLayerGeo,
};

function setTheme(baseLayerName: MapBaseLayerKeyType) {
    for (let l of Object.keys(mapBaseLayers)) {
        (mapBaseLayers as any)[l].setVisible(l === baseLayerName);
    }
}

// Zoom to the cluster or point on click
function clickMap(e: MapBrowserEvent<any>, map: Map | null, dispatch: Dispatch<UnknownAction>) {
    let didOneFeature = false;
    map!.forEachFeatureAtPixel(e.pixel, function (clickedFeature): void {
        if (clickedFeature && !didOneFeature) {
            // Clicked a clsuter
            if (clickedFeature.get('cluster_id')) {
                dispatch(setSelectionId(undefined));
                map!.getView().animate({
                    center: e.coordinate,
                    zoom: config.zoomLevelForPoints,
                    duration: 500,
                    easing: easeOut
                });
            }
            else {
                // Clicked a point
                const id = clickedFeature.get('id');
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

    const handleMoveEnd = () => {
        if (!mapRef.current) return;
        const center = mapRef.current.getView().getCenter() as [number, number];
        const zoom = mapRef.current.getView().getZoom() as number;
        const extent = mapRef.current.getView().calculateExtent(mapRef.current.getSize());
        const bounds = transformExtent(extent, 'EPSG:3857', 'EPSG:4326') as [number, number, number, number];
        dispatch(setMapParams({ center, zoom, bounds }));
    };

    useEffect(() => {
        setTheme(basemapSource);
    }, [basemapSource]);

    // Re-render visible layers when user selects a point to show highlighted selection
    useEffect(() => {
        Object.values(mapLayers).forEach((layer) => {
            if (layer.getVisible()) {
                const source = layer.getSource();
                source?.changed();
            }
        });
    }, [mapRef.current, selectionId]);

    useEffect(() => {
        let map: Map | null = null;

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
                    ...Object.values(mapLayers)
                ],
            });

            mapRef.current = map;

            useFeatureHighlighting(map);

            map.on('moveend', debounce(handleMoveEnd, config.gui.debounce, { immediate: true }));
            map.on('click', debounce((e) => clickMap(e, map, dispatch), config.gui.debounce, { immediate: true }));

            const { mvtLoadStart, mvtLoadEnd } = useProgressBar(dispatch);
            map.on('loadstart', () => {
                document.body.classList.add('loading');
                mvtLoadStart();
            });
            map.on('loadend', () => {
                document.body.classList.remove('loading');
                mvtLoadEnd();
            });
        }

        return () => map?.dispose();
    }, [dispatch]);

    useEffect(() => {
        if (!mapElementRef.current) return;
        if (updateMap === true) {
            mapLayers.all.getSource()?.refresh();
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
            {mapRef.current && <Tooltip map={mapRef.current as Map} />}
        </section>
    );
};



export default OpenLayersMap;

