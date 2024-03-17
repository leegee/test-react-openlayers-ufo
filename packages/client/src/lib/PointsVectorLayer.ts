// VectorLayer.ts

import { bbox } from "ol/loadingstrategy";
import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

import type { FeatureCollection } from '../redux/reducers';
import { sightingsStyleFunction } from "./sightings-styles";

const vectorSource = new VectorSource({
    strategy: bbox,
    format: new GeoJSON(),
});

export const vectorLayer = new VectorLayer({
    source: vectorSource,
    style: sightingsStyleFunction,
});

vectorLayer.set('name', 'points');

export function updateVectorLayer(featureCollection: FeatureCollection) {
    vectorSource.clear();
    vectorSource.addFeatures(new GeoJSON().readFeatures(featureCollection));
    console.debug("Number of features added:", vectorSource.getFeatures().length);
}
