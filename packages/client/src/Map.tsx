import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { Map, MapBrowserEvent, View } from 'ol';
import { fromLonLat, transformExtent } from 'ol/proj';
import { easeOut } from 'ol/easing';

import { RootState } from './redux/store';
import { setMapParams, fetchFeatures, selectBasemapSource, setBasemapSource } from './redux/mapSlice';
import { setupFeatureHighlighting } from './lib/VectorLayerHighlight';
import config from '@ufo-monorepo-test/config/src';
import { showPoint } from './custom-events/point-show';
import { hideReport, setReportWidth } from './custom-events/report-width';
import baseLayerDark from './lib/map-base-layer/layer-dark';
import baseLayerLight from './lib/map-base-layer/layer-osm';
import { updateVectorLayer as updateClusterLayer, vectorLayer as clusterLayer } from './lib/ServerClustersOnlyLyaer';
import { updateVectorLayer as updatePointsLayer, vectorLayer as pointsLayer } from './lib/PointsVectorLayer';
// import { updateVectorLayer as updateClusterLayer, vectorLayer as clusterLayer } from './lib/ClusterVectorLayer';

import 'ol/ol.css';
import './Map.css';

const OpenLayersMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const { center, zoom, bounds, featureCollection } = useSelector((state: RootState) => state.map);
  const basemapSource = useSelector(selectBasemapSource);

  const setTheme = () => {
    baseLayerDark.setVisible(basemapSource === 'dark');
    baseLayerLight.setVisible(basemapSource !== 'dark');
  };

  setTheme();

  const handleToggleTheme = () => {
    const newBasemapSource = basemapSource === 'dark' ? 'light' : 'dark';
    dispatch(setBasemapSource(newBasemapSource));
    setTheme();
  };

  useEffect(() => {
    let map: Map | null = null;

    pointsLayer.setVisible(false);
    clusterLayer.setVisible(true);

    if (mapRef.current) {
      map = new Map({
        target: mapRef.current,
        view: new View({
          center: fromLonLat(center),
          zoom,
        }),
        layers: [
          baseLayerDark,
          baseLayerLight,
          clusterLayer,
          pointsLayer,
        ],
      });

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
    if (!mapRef.current || !featureCollection || featureCollection.features === null) return;
    if (zoom < config.zoomLevelForPoints) {
      updateClusterLayer(featureCollection);
      clusterLayer.setVisible(true);
      pointsLayer.setVisible(false);
    } else {
      updatePointsLayer(featureCollection);
      clusterLayer.setVisible(false);
      pointsLayer.setVisible(true);
    }
  }, [featureCollection]);

  return (<section className='map' ref={mapRef} >
    <button onClick={handleToggleTheme} className='theme highlightable ol-unselectable ol-control' />
  </section>);
};

// Zoom to the cluster or point on click
function clickMap(e: MapBrowserEvent<any>, map: Map | null) {
  let didOneFeature = false;
  map!.forEachFeatureAtPixel(e.pixel, function (clickedFeature, layer): void {
    if (clickedFeature && !didOneFeature) {
      const features = clickedFeature.get('features');
      if (layer.get('name') == clusterLayer.get('name')) {
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


export default OpenLayersMap;

