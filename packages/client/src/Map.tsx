import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { Feature, Map, MapBrowserEvent, View } from 'ol';
import { fromLonLat, transformExtent } from 'ol/proj';
import { easeOut } from 'ol/easing';

import { RootState } from './redux/store';
import { setMapParams, fetchFeatures, selectBasemapSource, setBasemapSource } from './redux/mapSlice';
import { setupFeatureHighlighting } from './lib/VectorLayerHighlight';
import config from '@ufo-monorepo-test/config/src';
import { EVENT_SHOW_POINT, ShowPointEventType, showPoint } from './custom-events/point-show';
import { hideReport, setReportWidth } from './custom-events/report-width';
import baseLayerDark from './lib/map-base-layer/layer-dark';
import baseLayerLight from './lib/map-base-layer/layer-osm';
import baseLayerGeo from './lib/map-base-layer/layer-geo';
import { updateVectorLayer as updateClusterOnlyLayer, vectorLayer as clusterOnlyLayer } from './lib/ServerClustersOnlyLyaer';
import { updateVectorLayer as updatePointsLayer, vectorLayer as pointsLayer } from './lib/PointsVectorLayer';
import { updateVectorLayer as updateMixedSearchResultsLayer, vectorLayer as mixedSearchResultsLayer } from './lib/ClusterVectorLayer';

import 'ol/ol.css';
import './Map.css';
import Layer from 'ol/layer/Layer';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';

type MapLayerKeyType = 'clusterOnly' | 'mixedSearchResults' | 'points';

type MapLayersI = {
  [key in MapLayerKeyType]: VectorLayer<VectorSource<any>>;
}

const mapLayers: MapLayersI = {
  clusterOnly: clusterOnlyLayer,
  mixedSearchResults: mixedSearchResultsLayer,
  points: pointsLayer,
}

const OpenLayersMap: React.FC = () => {
  const dispatch = useDispatch();
  const { center, zoom, bounds, featureCollection, q } = useSelector((state: RootState) => state.map);
  const basemapSource = useSelector(selectBasemapSource);
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);

  setTheme(basemapSource);

  const handleToggleTheme = () => {
    const newBasemapSource = getNextBasemapSource(basemapSource);
    console.debug(`Map theme was ${basemapSource} now ${newBasemapSource}`);
    dispatch(setBasemapSource(newBasemapSource));
    setTheme(newBasemapSource);
  };

  useEffect(() => {
    const handleShowPointEvent = (e: ShowPointEventType) => {
      if (!e.detail.id) return;
      const feature = findFeature(pointsLayer, e.detail.id);
      if (feature) {
        centerMapOnFeature(mapRef.current!, feature);
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
          baseLayerDark,
          baseLayerLight,
          baseLayerGeo,
          ...Object.values(mapLayers)
        ],
      });

      mapRef.current = map;

      setupFeatureHighlighting(map);

      map.on('moveend', () => {
        if (!map) return;
        const center = map!.getView().getCenter() as [number, number];
        const zoom = map!.getView().getZoom() as number;
        const extent = map.getView().calculateExtent(map.getSize());
        const bounds = transformExtent(extent, 'EPSG:3857', 'EPSG:4326') as [number, number, number, number];
        dispatch(setMapParams({ center, zoom, bounds }));
      });

      map.on('click', (e) => clickMap(e, map));
    }

    return () => map?.dispose();
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchFeatures() as any);
    if (zoom < config.zoomLevelForPoints) {  // clusters - set in store based on reponse
      hideReport();
    }
  }, [dispatch, bounds, zoom]);

  useEffect(() => {
    if (!mapElementRef.current || !featureCollection || featureCollection.features === null) return;
    if (q && q.length >= config.minQLength) {
      setReportWidth('narrow');
      updateMixedSearchResultsLayer(featureCollection);
      setVisibleDataLayer('mixedSearchResults');
    } else if (zoom < config.zoomLevelForPoints) {
      updateClusterOnlyLayer(featureCollection);
      setVisibleDataLayer('clusterOnly');
    } else {
      updatePointsLayer(featureCollection);
      setVisibleDataLayer('points');
    }
  }, [featureCollection]);

  return (<section className='map' ref={mapElementRef} >
    <button onClick={handleToggleTheme} className='theme highlightable ol-unselectable ol-control' />
  </section>);
};


// Zoom to the cluster or point on click
function clickMap(e: MapBrowserEvent<any>, map: Map | null) {
  let didOneFeature = false;
  map!.forEachFeatureAtPixel(e.pixel, function (clickedFeature, layer): void {
    if (clickedFeature && !didOneFeature) {
      const features = clickedFeature.get('features');
      if (layer.get('name') == clusterOnlyLayer.get('name')) {
        map!.getView().animate({
          center: e.coordinate,
          zoom: config.zoomLevelForPoints,
          duration: 500,
          easing: easeOut
        });
      }
      else {
        showPoint(features ? features[0].get('id') : clickedFeature.get('id'));
      }
      didOneFeature = true;
      setReportWidth('narrow');
    }
  });
}


const getNextBasemapSource = (currentBasemapSource: string) => {
  switch (currentBasemapSource) {
    case 'dark':
      return 'light';
    case 'light':
      return 'geo';
    case 'geo':
    default:
      return 'dark';
  }
};

const setTheme = (newBasemapSource: string) => {
  switch (newBasemapSource) {
    case 'dark':
      baseLayerDark.setVisible(true);
      baseLayerLight.setVisible(false);
      baseLayerGeo.setVisible(false);
      break;
    case 'light':
      baseLayerDark.setVisible(false);
      baseLayerLight.setVisible(true);
      baseLayerGeo.setVisible(false);
      break;
    case 'geo':
      baseLayerDark.setVisible(false);
      baseLayerLight.setVisible(false);
      baseLayerGeo.setVisible(true);
      break;
    default:
      baseLayerDark.setVisible(false);
      baseLayerLight.setVisible(false);
      baseLayerGeo.setVisible(true);
      break;
  }
};

function centerMapOnFeature(map: Map, feature: any) { // ugh
  const geometry = feature.getGeometry();
  if (geometry) {
    const coordinates = geometry.getCoordinates();
    map.getView().animate({
      center: coordinates,
      zoom: config.zoomLevelForPoints + 5,
      duration: 500,
    });
  }
}

function findFeature(layer: Layer, id: string | number): Feature | null {
  const source = layer.getSource() as VectorSource;
  const features = source.getFeatures();

  for (const feature of features) {
    if (feature.get('id') == id) {
      return feature;
    }
  }
  return null;
}

function setVisibleDataLayer(layerName: MapLayerKeyType) {
  console.info('setVisibleDataLayer', layerName);
  for (let l of Object.keys(mapLayers)) {
    (mapLayers as any)[l].setVisible(l === layerName);
  }
}

export default OpenLayersMap;

