import React, { type Dispatch, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { type UnknownAction } from '@reduxjs/toolkit';
import debounce from 'debounce';
import { Map, type MapBrowserEvent, View } from 'ol';
import { fromLonLat, transformExtent } from 'ol/proj';
import { easeOut } from 'ol/easing';
import type Layer from 'ol/layer/Layer';

import config from '@ufo-monorepo-test/config/src';
import { RootState } from './redux/store';
import { setMapParams, fetchFeatures, selectBasemapSource, selectPointsCount, resetDates } from './redux/mapSlice';
import { setSelectionId } from './redux/guiSlice';
import { setupFeatureHighlighting } from './Map/VectorLayerHighlight';
import Tooltip from './Map/Tooltip';
import labelsLayer from './lib/map-base-layer/layer-labels';
import baseLayerDark from './lib/map-base-layer/layer-dark';
import baseLayerLight from './lib/map-base-layer/layer-osm';
import baseLayerGeo from './lib/map-base-layer/layer-geo';
// import { updateVectorLayer as updateClusterOnlyLayer, vectorLayer as clusterOnlyLayer } from './lib/ServerClustersOnlyLyaer';
import { updateVectorLayer as updateClusterOnlyLayer, vectorLayer as clusterOnlyLayer, setupHeatmapListeners } from './lib/HeatmapLayer';
import { updateVectorLayer as updatePointsLayer, vectorLayer as pointsLayer } from './lib/PointsVectorLayer';
// import { /*updateVectorLayer as updateMixedSearchResultsLayer,*/ vectorLayer as mixedSearchResultsLayer } from './lib/LocalClusterVectorLayer';
import ThemeToggleButton from './Map/ThemeToggleButton';
import LocaleManager from './LocaleManager';

import 'ol/ol.css';
import './Map.css';

export type MapBaseLayerKeyType = 'dark' | 'light' | 'geo';
export type MapLayerKeyType = 'clusterOnly' |  'points'; // | 'mixedSearchResults'
export type MapBaseLayersType = {
  [key in MapBaseLayerKeyType]: Layer
}

type MapLayersType = {
  [key in MapLayerKeyType]: Layer;
}

const mapLayers: MapLayersType = {
  clusterOnly: clusterOnlyLayer,
  // mixedSearchResults: mixedSearchResultsLayer,
  points: pointsLayer,
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
      // Clicked a clsuter
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
        const id = Number(clickedFeature.get('id'));
        dispatch(resetDates());
        dispatch(setSelectionId(id));
      }
      didOneFeature = true;
    }
  });
}

function setVisibleDataLayer(layerName: MapLayerKeyType) {
  for (const l of Object.keys(mapLayers)) {
    mapLayers[l as MapLayerKeyType].setVisible(l === layerName);
  }
}

// function centerMapOnFeature(map: Map, feature: any) { // ugh
//   const geometry = feature.getGeometry();
//   if (geometry) {
//     const coordinates = geometry.getCoordinates();
//     map.getView().animate({
//       center: coordinates,
//       zoom: config.zoomLevelForPointDetails,
//       duration: 500,
//     });
//   }
// }

// function findFeatureById(layer: Layer, id: string | number): Feature | null {
//   const source = layer.getSource() as VectorSource;
//   const features = source.getFeatures();

//   for (const feature of features) {
//     if (feature.get('id') == id) {
//       return feature;
//     }
//   }
//   return null;
// }

const OpenLayersMap: React.FC = () => {
  const dispatch = useDispatch();
  const pointsCount = useSelector(selectPointsCount);
  const { center, zoom, bounds, featureCollection, q } = useSelector((state: RootState) => state.map);
  const { selectionId, panel: panelState } = useSelector((state: RootState) => state.gui);
  const basemapSource: MapBaseLayerKeyType = useSelector(selectBasemapSource);
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);

  const handleMoveEnd = () => {
    if (!mapRef.current) return;
    const center = mapRef.current.getView().getCenter() as [number, number];
    const zoom = Number(mapRef.current.getView().getZoom()) || 1;
    const extent = mapRef.current.getView().calculateExtent(mapRef.current.getSize());
    const bounds = transformExtent(extent, 'EPSG:3857', 'EPSG:4326') as [number, number, number, number];
    dispatch(setMapParams({ center, zoom, bounds }));
  };

  useEffect(() => {
    setTheme(basemapSource);
  }, [basemapSource]);

  // Re-render visible layers when user selects a point
  useEffect(() => {
    Object.values(mapLayers).forEach((layer) => {
      if (layer.getVisible()) {
        const source = layer.getSource();
        source?.changed();
      }
    });
  }, [selectionId]);

  useEffect(() => {
    if (mapElementRef.current) {
      setVisibleDataLayer('clusterOnly');

      const map = new Map({
        target: mapElementRef.current,
        view: new View({
          center: fromLonLat(center),
          zoom,
          minZoom: 4,
        }),
        layers: [
          ...Object.values(mapBaseLayers),
          labelsLayer,
          ...Object.values(mapLayers)
        ],
      });

      mapRef.current = map;
      setupHeatmapListeners(mapRef.current);
      setupFeatureHighlighting(mapRef.current);

      map.on('moveend', debounce(handleMoveEnd, config.gui.debounce, { immediate: true }));

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      map.on('click', debounce((e) => clickMap(e, map, dispatch), config.gui.debounce, { immediate: true }));
    }

    return () => mapRef.current?.dispose();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

useEffect(() => { 
  const debouncedFetchFeatures = debounce(() => {
    dispatch(fetchFeatures());
  }, 750);

  debouncedFetchFeatures();

}, [dispatch, bounds, zoom]);

  useEffect(() => {
    // if (!mapElementRef.current || featureCollection === null) return;
    if (!mapElementRef.current || !featureCollection ) return;
    if (q && q.length >= config.minQLength && (!pointsCount || pointsCount < 1000)) {
      // updateMixedSearchResultsLayer(featureCollection);
      // setVisibleDataLayer('mixedSearchResults');
      updatePointsLayer(featureCollection);
      setVisibleDataLayer('points');
    } else if (!pointsCount && zoom < config.zoomLevelForPoints) {
      updateClusterOnlyLayer(featureCollection);
      setVisibleDataLayer('clusterOnly');
    } else {
      updatePointsLayer(featureCollection);
      setVisibleDataLayer('points');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featureCollection]);

  useEffect(() => {
    console.log('Component re-rendered with panelState:', panelState);
  }, [panelState]);

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

