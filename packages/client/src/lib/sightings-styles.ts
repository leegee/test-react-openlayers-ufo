// lib/sightings-styles.ts.ts

import Feature, { FeatureLike } from "ol/Feature";
import { Circle, Fill, Stroke, Style, Text } from "ol/style";

const bgSaturation = 100;
const bgLightness = 50;
const borderSaturation = 80;
const borderLightness = 20;

export function mapScoreToHue(score: number): number {
    const value = Math.min(Math.max(score, 0), 1);
    const hue = (1 + value) * 180; // red -> cyanish
    return hue;
}

function mapLocalClusterToColor(feature: FeatureLike): string {
    // console.log(feature)
    return 'blue';
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
        const background = mapLocalClusterToColor(feature);
        style = new Style({
            image: new Circle({
                radius: 10,
                fill: new Fill({ color: background }),
                stroke: new Stroke({ color: '#3399CC', width: 2 })
            }),
            text: new Text({
                text: clusterSizeMadeLocally.toString(),
                fill: new Fill({ color: 'white' })
            })
        });
    }

    else {
        const score = parseFloat(feature.get('search_score'));
        const hue = score ? mapScoreToHue(score) : '180';
        (feature as Feature).set('zIndex', score * 100);
        style = new Style({
            image: new Circle({
                radius: 10,
                fill: new Fill({ color: `hsl(${hue}, ${bgSaturation}%, ${bgLightness}%)` }),
                stroke: new Stroke({
                    color: `hsl(${hue}, ${borderSaturation}%, ${borderLightness}%)`,
                    width: 2
                })
            }),
        });
    }

    return style;
};
