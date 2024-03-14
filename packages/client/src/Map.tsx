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
import { Circle, Fill, Stroke, Style } from "ol/style";

import { RootState } from './redux/store';
import { setMapParams, fetchFeatures } from './redux/mapSlice';

import 'ol/ol.css';
import './Map.css';

const sightingStyleFunction = (feature: FeatureLike) => {
  const properties = feature.getProperties();
  alert('style')
  console.log(properties)

  return new Style({
    image: new Circle({
      radius: 15,
      fill: new Fill({ color: 'blue' }),
    }),
  });
};

const OpenLayersMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const { center, zoom, bounds, featureCollection } = useSelector((state: RootState) => state.map);

  const vectorSource = new VectorSource({
    strategy: bbox,
    format: new GeoJSON(),
  });

  const vectorLayer = new VectorLayer({
    source: vectorSource,
    // style: sightingStyleFunction
    style: new Style({
      fill: new Fill({
        color: 'red',
      }),
      stroke: new Stroke({
        color: 'white',
      }),
      image: new Circle({
        radius: 7,
        fill: new Fill({ color: 'black' }),
        stroke: new Stroke({
          color: [255, 0, 0], width: 2
        })
      })
    }),
  });

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
          vectorLayer
        ],
      });

      map.on('moveend', () => {
        if (!map) return;
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

    return () => map?.dispose();
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchFeatures() as any);
  }, [dispatch, bounds, zoom]);

  useEffect(() => {
    if (!mapRef.current || !featureCollection || featureCollection.features === null) return;
    vectorSource.clear();
    console.log('featureCollection', featureCollection);
    vectorSource.addFeatures(
      new GeoJSON().readFeatures(featureCollection)
    );
    const numFeatures = vectorSource.getFeatures().length;
    console.log("Number of features added:", numFeatures, vectorSource.getFeatures());

  }, [vectorSource, featureCollection]);

  return <div ref={mapRef} className="map"></div>;
};

export default OpenLayersMap;
