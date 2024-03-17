import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { Map, View } from 'ol';
import { fromLonLat, transformExtent } from 'ol/proj';
import { easeOut } from 'ol/easing';

import { RootState } from './redux/store';
import { setMapParams, fetchFeatures } from './redux/mapSlice';
import { setupFeatureHighlighting } from './lib/VectorLayerHighlight';
import config from '@ufo-monorepo-test/config/src';
import { showPoint } from './custom-events/point-show';
import baseLayer from './lib/map-base-layer/layer-dark';
import { updateVectorLayer as updateClusterLayer, vectorLayer as clusterLayer } from './lib/ClusterVectorLayer';
import { updateVectorLayer as updatePointsLayer, vectorLayer as pointsLayer } from './lib/PointsVectorLayer';
import { REPORT_FULL_WIDTH, REPORT_NARROW_WIDTH } from './ResultsPanel';

import 'ol/ol.css';
import './Map.css';

const OpenLayersMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const { center, zoom, bounds, featureCollection } = useSelector((state: RootState) => state.map);
  const [fullWidth, setFullWidth] = useState<boolean>(false);

  useEffect(() => {
    window.document.addEventListener(REPORT_FULL_WIDTH, (() => setFullWidth(true)) as EventListener);
  }, []);

  useEffect(() => {
    window.document.addEventListener(REPORT_NARROW_WIDTH, (() => setFullWidth(false)) as EventListener);
  }, []);


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
          baseLayer,
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

      map.on('click', function (e) {
        // Zoom to the cluster or point
        map!.forEachFeatureAtPixel(e.pixel, function (clickedFeature, layer): void {
          if (clickedFeature) {
            const features = clickedFeature.get('features');
            if (layer.get('name') == clusterLayer.get('name')) { // if (zoom < config.zoomLevelForPoints) {
              map!.getView().animate({
                center: e.coordinate,
                zoom: config.zoomLevelForPoints,
                duration: 500,
                easing: easeOut
              });
            } else {
              showPoint(
                features ? features[0].get('id') : clickedFeature.get('id')
              );
            }
          }
        });
      });

    }

    return () => map?.dispose();
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchFeatures() as any)
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

  return <div className={fullWidth ? 'full-width map' : 'narrow-width map'} ref={mapRef} />;
};

export default OpenLayersMap;

