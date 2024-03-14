import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { Map, View } from 'ol';
import { fromLonLat, transformExtent } from 'ol/proj';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';

import { RootState } from './redux/store';
import { setMapParams, fetchFeatures } from './redux/mapSlice';
import { setupFeatureHighlighting } from './lib/VectorLayerHighlight';
// import { updateVectorLayer, vectorLayer } from './lib/VectorLayer';
import { updateVectorLayer, vectorLayer } from './lib/ClusterVectorLayer';

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
          new TileLayer({ source: new OSM() }),
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

