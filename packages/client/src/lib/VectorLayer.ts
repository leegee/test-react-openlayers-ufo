// VectorLayer.ts

import { bbox } from "ol/loadingstrategy";
import { Circle, Fill, Style } from "ol/style";
// import { FeatureLike } from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import type { FeatureCollection } from '../redux/reducers';

const sightingStyleFunction = (
    // feature: FeatureLike
) => {
    // const properties = feature.getProperties();
    return new Style({
        image: new Circle({
            radius: 3,
            fill: new Fill({ color: 'blue' }),
        }),
    });
};

export const vectorSource = new VectorSource({
    strategy: bbox,
    format: new GeoJSON(),
});

export const vectorLayer = new VectorLayer({
    source: vectorSource,
    style: sightingStyleFunction,
});

export function updateVectorLayer(featureCollection: FeatureCollection) {
    vectorSource.clear();
    vectorSource.addFeatures(new GeoJSON().readFeatures(featureCollection));
    console.log("Number of features added:", vectorSource.getFeatures().length);
}
