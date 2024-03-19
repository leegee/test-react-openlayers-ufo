// lib/sightings-styles.ts.ts

import { FeatureLike } from "ol/Feature";
import { Circle, Fill, Stroke, Style, Text } from "ol/style";

const saturation = 100;
const lightness = 50;

function mapNumberToColor(feature: FeatureLike): string {
    const value = Math.min(Math.max(parseFloat(feature.get('search_score')), 0), 1);
    const hue = (1 - value) * 120; // Red at 0, Green at 1
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export const sightingsStyleFunction = (feature: FeatureLike, _resolution: number): Style => {
    const features = feature.get('features');
    const clusterSizeFromServer = feature.get('num_points');
    const clusterSizeMadeLocally = features ? features.length : undefined;
    let style;

    if (clusterSizeFromServer) {
        style = new Style({
            image: new Circle({
                radius: 10,
                fill: new Fill({ color: 'rgba(25, 25, 255, 0.7)' }),
                stroke: new Stroke({ color: '#3399CC', width: 2 })
            }),
            text: new Text({
                text: clusterSizeFromServer.toString(),
                fill: new Fill({ color: 'white' })
            })
        });
    }

    else if (clusterSizeMadeLocally) {
        style = new Style({
            image: new Circle({
                radius: 10,
                fill: new Fill({ color: 'rgba(25, 25, 255, 0.7)' }),
                stroke: new Stroke({ color: '#3399CC', width: 2 })
            }),
            text: new Text({
                text: clusterSizeMadeLocally.toString(),
                fill: new Fill({ color: 'white' })
            })
        });
    }

    else {
        const background = mapNumberToColor(feature);

        style = new Style({
            image: new Circle({
                radius: 10,
                fill: new Fill({ color: background }),
                stroke: new Stroke({ color: '#3399CC', width: 2 })
            }),
        });
    }

    return style;
};
