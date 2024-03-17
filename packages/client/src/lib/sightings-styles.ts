// lib/sightings-styles.ts.ts

import { FeatureLike } from "ol/Feature";
import { Circle, Fill, Stroke, Style, Text } from "ol/style";

export const sightingsStyleFunction = (feature: FeatureLike, _resolution: number): Style => {
    const features = feature.get('features');
    const size = features ? features.length : undefined;
    let style;

    if (size) {
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
    }

    else {
        style = new Style({
            image: new Circle({
                radius: 10,
                fill: new Fill({ color: 'cyan' }),
                stroke: new Stroke({ color: '#3399CC', width: 2 })
            }),
        });
    }

    return style;
};
