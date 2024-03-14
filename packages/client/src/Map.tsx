import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { Map, View } from 'ol';
import { bbox } from "ol/loadingstrategy";
import { fromLonLat, transformExtent } from 'ol/proj';
import GeoJSON from 'ol/format/GeoJSON';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { FeatureLike } from 'ol/Feature';
import { Circle, Fill, Style } from "ol/style";

import { RootState } from './redux/store';
import { setMapParams, fetchFeatures } from './redux/mapSlice';

import 'ol/ol.css';
import './Map.css';

const sightingStyleFunction = (feature: FeatureLike) => {
  const properties = feature.getProperties();
  return new Style({
    image: new Circle({
      radius: 3,
      fill: new Fill({ color: 'blue' }),
    }),
  });
};

const vectorSource = new VectorSource({
  strategy: bbox,
  format: new GeoJSON(),
});

const vectorLayer = new VectorLayer({
  source: vectorSource,
  style: sightingStyleFunction,
});

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

      map.on('moveend', () => {
        if (!map) return;
        const center = map!.getView().getCenter() as [number, number];
        const zoom = map!.getView().getZoom() as number;
        const extent = map.getView().calculateExtent(map.getSize());
        const bounds = transformExtent(extent, 'EPSG:3857', 'EPSG:4326') as [number, number, number, number];
        dispatch(
          setMapParams({ center, zoom, bounds })
        );
      });
    }

    return () => map?.dispose();
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchFeatures() as any);
  }, [dispatch, bounds, zoom]);

  useEffect(() => {
    if (!mapRef.current || !featureCollection || featureCollection.features === null) return;
    vectorSource.clear();

    vectorSource.addFeatures(new GeoJSON().readFeatures(featureCollection));
    console.log("Number of features added:", vectorSource.getFeatures().length, vectorSource.getFeatures());

    const osloOLFeature = new GeoJSON().readFeature({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: fromLonLat([10, 59])
        // coordinates: [3376031.429992337, 11271655.748910023]
      },
      properties: { name: 'Oslo', description: 'Capital of Norway' }
    });
    vectorSource.addFeature(osloOLFeature);

    console.log("Number of features added:", vectorSource.getFeatures().length, vectorSource.getFeatures());
    // vectorLayer.changed();

  }, [vectorSource, featureCollection]);

  return <div ref={mapRef} className="map"></div>;
};

export default OpenLayersMap;
