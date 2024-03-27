// lib/sightings-styles.ts.ts

import type { FeatureLike } from "ol/Feature";
import { Circle, Fill, Stroke, Style, Text } from "ol/style";

import { store } from "../redux/store";

const bgSaturation = 100;
const bgLightness = 50;
const borderSaturation = 80;
const borderLightness = 20;

export function mapScoreToHue(score: number): number {
    const value = Math.min(Math.max(score, 0), 1);
    const hue = (1 + value) * 180;
    return hue;
}

function mapLocalClusterToColor(): string {
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
        const background = mapLocalClusterToColor();
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
        const selectionId = store.getState().gui.selectionId;
        const selected = selectionId && selectionId === feature.get('id');

        const score = parseFloat(feature.get('search_score'));
        // const hue = score ? mapScoreToHue(score) : '180';
        const hue = 180;
        let alpha = 1;
        if (score) {
            // (feature as Feature).set('zIndex', score * 2);
            alpha = score + 0.2;
            if (alpha < 0.55) alpha = 0.55;
            console.log(alpha);
        }
        style = new Style({
            image: new Circle({
                radius: 10,
                fill: new Fill({
                    color: selected ? 'hsl(40,100%,70%)' : `hsla(${hue}, ${bgSaturation}%, ${bgLightness}%, ${alpha})`
                }),
                stroke: new Stroke(
                    selected ? {
                        color: 'hsl(40,100%,60%)',
                        width: 8
                    } : {
                        color: `hsla(${hue}, ${borderSaturation}%, ${borderLightness}%, ${alpha})`,
                        width: 2
                    }
                )
            }),
        });
    }

    return style;
};
