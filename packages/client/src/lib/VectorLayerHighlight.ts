// VectorlayerHighlight

// wip

import { Map } from 'ol';
import Feature from 'ol/Feature';
import { Geometry } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Stroke } from 'ol/style';

const featureOverlay = new VectorLayer({
    source: new VectorSource(),
    style: new Style({
        stroke: new Stroke({
            color: 'rgba(255, 255, 255, 0.7)',
            width: 2,
        }),
    }),
});

let highlight: Feature<Geometry>;

export function setupFeatureHighlighting(map: Map) {
    map.addLayer(featureOverlay);

    map.on('pointermove', function (evt) {
        if (evt.dragging) {
            return;
        }
        const pixel = map.getEventPixel(evt.originalEvent);
        displayFeatureInfo(map, pixel);
    });

    map.on('click', function (evt) {
        displayFeatureInfo(map, evt.pixel);
    });
}

function displayFeatureInfo(map: Map, pixel: number[]) {
    const feature = map.forEachFeatureAtPixel(pixel, function (feature) {
        return feature;
    });

    if (feature !== highlight) {
        if (highlight) {
            featureOverlay!.getSource()!.removeFeature(highlight);
        }
        if (feature) {
            featureOverlay!.getSource()!.addFeature(feature as Feature<Geometry>);
        }
        highlight = feature as Feature<Geometry>;
    }
}
