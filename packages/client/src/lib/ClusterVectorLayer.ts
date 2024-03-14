// ClusterVectorLayer.ts
import { bbox } from "ol/loadingstrategy";
import { Circle, Fill, Stroke, Style, Text } from "ol/style";
import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Cluster from 'ol/source/Cluster';
import type { FeatureCollection } from '../redux/reducers';
import { FeatureLike } from "ol/Feature";

const CLUSTER_DISTANCE = 40;

const vectorSource = new VectorSource({
    strategy: bbox,
    format: new GeoJSON(),
});

const sightingStyleFunction = (feature: FeatureLike, _resolution: number): Style => {
    const size = feature.get('features').length;
    let style;

    if (size > 1) {
        style = new Style({
            image: new Circle({
                radius: 10,
                fill: new Fill({ color: 'rgba(25, 25, 255, 0.7)' }),
                stroke: new Stroke({ color: '#3399CC', width: 2 })
            }),
            text: new Text({
                text: size.toString(),
                fill: new Fill({ color: 'white' })
            })
        });
    } else {
        style = new Style({
            image: new Circle({
                radius: 5,
                fill: new Fill({ color: 'blue' }),
            }),
        });
    }

    return style;
};

const clusterSource = new Cluster({
    distance: CLUSTER_DISTANCE,
    source: vectorSource
});

export const vectorLayer = new VectorLayer({
    source: clusterSource,
    style: sightingStyleFunction,
});

export function updateVectorLayer(featureCollection: FeatureCollection) {
    vectorSource.clear();
    vectorSource.addFeatures(new GeoJSON().readFeatures(featureCollection));
    console.log("Number of features added:", vectorSource.getFeatures().length);
}
