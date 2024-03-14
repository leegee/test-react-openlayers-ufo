import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Map, View } from 'ol';

import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat, transformExtent } from 'ol/proj';

import { RootState } from './redux/store';
import { setMapParams, fetchData } from './redux/mapSlice';

import 'ol/ol.css';
import './Map.css';

const OpenLayersMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const { center, zoom, bounds } = useSelector((state: RootState) => state.map);

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
          new TileLayer({
            source: new OSM(),
          }),
        ],
      });

      map.on('moveend', () => {
        if (!map) {
          return;
        }
        const center = map!.getView().getCenter() as [number, number];
        const zoom = map!.getView().getZoom() as number;
        const view = map!.getView();
        const size = map.getSize();
        const bounds = transformExtent(view.calculateExtent(size), 'EPSG:3857', 'EPSG:4326') as [number, number, number, number];
        dispatch(
          setMapParams({ center, zoom, bounds })
        );
      });
    }

    return () => {
      map?.dispose();
    };
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchData() as any); // ikr
  }, [dispatch, bounds, zoom]);

  return <div ref={mapRef} className="map"></div>;
};

export default OpenLayersMap;
