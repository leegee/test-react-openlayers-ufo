import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import debounce from 'debounce';
import { Feature, Map, MapBrowserEvent, View } from 'ol';
import { fromLonLat, transformExtent } from 'ol/proj';
import { easeOut } from 'ol/easing';
import Layer from 'ol/layer/Layer';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import TileLayer from 'ol/layer/Tile';

import config from '@ufo-monorepo-test/config/src';
import { RootState } from './redux/store';
import { setMapParams, fetchFeatures, selectBasemapSource, selectPointsCount } from './redux/mapSlice';
import { useFeatureHighlighting } from './Map/VectorLayerHighlight';
import Tooltip from './Map/Tooltip';
import { EVENT_SHOW_POINT, ShowPointEventType, showPoint } from './custom-events/point-show';
import labelsLayer from './lib/map-base-layer/layer-labels';
import baseLayerDark from './lib/map-base-layer/layer-dark';
import baseLayerLight from './lib/map-base-layer/layer-osm';
import baseLayerGeo from './lib/map-base-layer/layer-geo';
import { updateVectorLayer as updateClusterOnlyLayer, vectorLayer as clusterOnlyLayer } from './lib/ServerClustersOnlyLyaer';
import { updateVectorLayer as updatePointsLayer, vectorLayer as pointsLayer } from './lib/PointsVectorLayer';
import { /*updateVectorLayer as updateMixedSearchResultsLayer,*/ vectorLayer as mixedSearchResultsLayer } from './lib/LocalClusterVectorLayer';
import ThemeToggleButton from './Map/ThemeToggleButton';

import 'ol/ol.css';
import './Map.css';

export type MapBaseLayerKeyType = 'dark' | 'light' | 'geo';
export type MapLayerKeyType = 'clusterOnly' | 'mixedSearchResults' | 'points';
export type MapBaseLayersType = {
  [key in MapBaseLayerKeyType]: VectorLayer<VectorSource<any>> | TileLayer<any>;
}

type MapLayersType = {
  [key in MapLayerKeyType]: VectorLayer<VectorSource<any>>;
}

const mapLayers: MapLayersType = {
  clusterOnly: clusterOnlyLayer,
  mixedSearchResults: mixedSearchResultsLayer,
  points: pointsLayer,
}

const mapBaseLayers: MapBaseLayersType = {
  dark: baseLayerDark,
  light: baseLayerLight,
  geo: baseLayerGeo,
};

const setTheme = (baseLayerName: MapBaseLayerKeyType) => {
  for (let l of Object.keys(mapBaseLayers)) {
    (mapBaseLayers as any)[l].setVisible(l === baseLayerName);
  }
}

function setVisibleDataLayer(layerName: MapLayerKeyType) {
  console.info('setVisibleDataLayer', layerName);
  for (let l of Object.keys(mapLayers)) {
    (mapLayers as any)[l].setVisible(l === layerName);
  }
}

function centerMapOnFeature(map: Map, feature: any) { // ugh
  const geometry = feature.getGeometry();
  if (geometry) {
    const coordinates = geometry.getCoordinates();
    map.getView().animate({
      center: coordinates,
      zoom: config.zoomLevelForPointDetails,
      duration: 500,
    });
  }
}

function findFeatureById(layer: Layer, id: string | number): Feature | null {
  const source = layer.getSource() as VectorSource;
  const features = source.getFeatures();

  for (const feature of features) {
    if (feature.get('id') == id) {
      return feature;
    }
  }
  return null;
}

const OpenLayersMap: React.FC = () => {
  const dispatch = useDispatch();
  const pointsCount = useSelector(selectPointsCount);
  const { center, zoom, bounds, featureCollection, q } = useSelector((state: RootState) => state.map);
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

  useEffect(() => {
    const handleShowPointEvent = (e: ShowPointEventType) => {
      let feature;
      if (e.detail.id) {
        feature = findFeatureById(pointsLayer, e.detail.id);
      }
      if (feature) {
        centerMapOnFeature(mapRef.current!, feature);
      }
      else if (e.detail.coords && mapRef.current) {
        mapRef.current.getView().animate({
          center: e.detail.coords,
          zoom: config.zoomLevelForPointDetails,
          duration: 500,
          easing: easeOut
        });
      }
    };

    document.addEventListener(EVENT_SHOW_POINT, handleShowPointEvent as EventListener);

    return () => {
      document.removeEventListener(EVENT_SHOW_POINT, handleShowPointEvent as EventListener);
    };
  }, []);

  useEffect(() => {
    let map: Map | null = null;

    if (mapElementRef.current) {
      setVisibleDataLayer('clusterOnly');

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

      map.on('click', debounce((e) => clickMap(e, map), config.gui.debounce, { immediate: true }));
    }

    return () => map?.dispose();
  }, [dispatch]);

  const debouncedMapChanged = debounce(() => {
    dispatch((fetchFeatures() as any));
  }, 500);

  useEffect(debouncedMapChanged, [dispatch, bounds, zoom]);

  useEffect(() => {
    if (!mapElementRef.current || featureCollection === null) return;
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
  }, [featureCollection]);

  return (
    <section className='map' ref={mapElementRef} >
      <ThemeToggleButton />
      {mapRef.current && <Tooltip map={mapRef.current as Map} />}
    </section>
  );
};


// Zoom to the cluster or point on click
function clickMap(e: MapBrowserEvent<any>, map: Map | null) {
  let didOneFeature = false;
  map!.forEachFeatureAtPixel(e.pixel, function (clickedFeature): void {
    if (clickedFeature && !didOneFeature) {
      if (clickedFeature.get('cluster_id')) { // clsuter
        map!.getView().animate({
          center: e.coordinate,
          zoom: config.zoomLevelForPoints,
          duration: 500,
          easing: easeOut
        });
      }
      else { // point
        console.log('click', clickedFeature);
        showPoint(clickedFeature.get('id'));
      }
      didOneFeature = true;
    }
  });
}

export default OpenLayersMap;

