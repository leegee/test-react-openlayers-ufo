import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { Map, View } from 'ol';
import { fromLonLat, transformExtent } from 'ol/proj';
import { easeOut } from 'ol/easing';

import { RootState } from './redux/store';
import { setMapParams, fetchFeatures } from './redux/mapSlice';
import { setupFeatureHighlighting } from './lib/VectorLayerHighlight';
import baseLayer from './lib/map-base-layer/layer-dark';
import { updateVectorLayer, vectorLayer } from './lib/ClusterVectorLayer';
import { EVENT_SHOW_ROW, ShowReportRowEventType } from './FeaturesTable';

import 'ol/ol.css';
import './Map.css';

const OpenLayersMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const { center, zoom, bounds, featureCollection } = useSelector((state: RootState) => state.map);

  useEffect(() => {
    let map: Map | null = null;

    if (mapRef.current) {
      map = new Map({
        target: mapRef.current,
        view: new View({
          center: fromLonLat(center),
          zoom,
        }),
        layers: [
          baseLayer,
          vectorLayer
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
        map!.forEachFeatureAtPixel(e.pixel, function (clickedFeature, _layer) {
          if (clickedFeature) {
            const features = clickedFeature.get('features');
            if (features.length === 1) {
              window.document.dispatchEvent(
                new CustomEvent(EVENT_SHOW_ROW, { detail: { id: features[0].get('id') } }) as ShowReportRowEventType
              );
            }
            else {
              map!.getView().animate({
                center: e.coordinate,
                zoom: 9,
                duration: 500,
                easing: easeOut
              });
            }
          }
        });
      });

    }

    return () => map?.dispose();
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchFeatures() as any);
  }, [dispatch, bounds, zoom]);

  useEffect(() => {
    if (!mapRef.current || !featureCollection || featureCollection.features === null) return;
    updateVectorLayer(featureCollection);
  }, [featureCollection]);

  return <div ref={mapRef} className="map"></div>;
};

export default OpenLayersMap;

