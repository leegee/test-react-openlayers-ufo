import type { View } from 'ol';
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

export function updateVectorLayer(featureCollection: UfoFeatureCollection|null) {
    if (featureCollection) {
        if (featureCollection.features) {
            vectorSource.clear();
            vectorSource.addFeatures(new GeoJSON().readFeatures(featureCollection));
            vectorSource.changed();
            console.debug("Number of features added:", vectorSource.getFeatures().length);
        }
    } else {
        console.debug('No features to add');
    }
} 

export function setupHeatmapListeners(map){
    map.on('moveend', () => updateLayerProperties(map) );
}

function updateLayerProperties(map) {
    if (map) {
        const view = map.getView() as View | undefined;
        const zoom: number = view.getZoom();
        const newRadius = zoom >= 5 ? 14 : 5; 
        const newBlur = zoom >= 5 ? 12 : 7; 
        console.log(zoom);
        
        vectorLayer.setBlur(newBlur);
        vectorLayer.setRadius(newRadius);
    }
}
