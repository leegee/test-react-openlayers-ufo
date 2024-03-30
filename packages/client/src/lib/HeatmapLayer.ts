import GeoJSON from 'ol/format/GeoJSON';
import VectorSource from 'ol/source/Vector';
import { bbox } from "ol/loadingstrategy";
import { Heatmap as HeatmapLayer } from 'ol/layer';

import type { UfoFeatureCollection } from '../redux/mapSlice';

const vectorSource = new VectorSource({
    format: new GeoJSON(),
    strategy: bbox,
});

export const vectorLayer = new HeatmapLayer({
    source: vectorSource,
    radius: 7,
    blur: 10,
    weight: (feature) => {
        return Number(feature.get('num_points')) + 1;
    },
});

vectorLayer.set('name', 'server-clusters-only');

export function updateVectorLayer(featureCollection: UfoFeatureCollection) {
    vectorSource.clear();
    if (featureCollection.features !== null) {
        vectorSource.addFeatures(new GeoJSON().readFeatures(featureCollection));
    }
    vectorSource.changed();
    console.debug("Number of features added:", vectorSource.getFeatures().length);
}
