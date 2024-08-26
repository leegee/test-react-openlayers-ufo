// ServerClustersOnlyLyaer.ts

import { bbox } from "ol/loadingstrategy";
import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

import type { UfoFeatureCollectionType } from '@ufo-monorepo/common-types';
import { sightingsStyleFunction } from "./map-style";

const vectorSource = new VectorSource({
    strategy: bbox,
    format: new GeoJSON(),
});

export const vectorLayer = new VectorLayer({
    source: vectorSource,
    style: sightingsStyleFunction,
});

vectorLayer.set('name', 'server-clusters-only');

export function updateVectorLayer(featureCollection: UfoFeatureCollectionType) {
    vectorSource.clear();
    vectorSource.addFeatures(new GeoJSON().readFeatures(featureCollection));
    vectorSource.changed();
    console.debug("Number of features added:", vectorSource.getFeatures().length);
}
