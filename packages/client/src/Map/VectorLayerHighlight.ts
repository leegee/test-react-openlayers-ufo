// map/VectorlayerHighlight

import type { Map } from 'ol';
import Feature from 'ol/Feature';
import { Geometry } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Stroke } from 'ol/style';

const featureOverlay = new VectorLayer({
    source: new VectorSource(),
    style: (_feature) => {
        return new Style({
            stroke: new Stroke({
                color: 'yellow',
                width: 4,
            }),
        });
    },
});

let highlight: Feature<Geometry>;

export function useFeatureHighlighting(map: Map) {
    featureOverlay.setVisible(true);
    map.addLayer(featureOverlay);

    map.on('pointermove', function (evt) {
        if (evt.dragging) return;
        const pixel = map.getEventPixel(evt.originalEvent);
        highlightFeature(map, pixel);
    });
}

function highlightFeature(map: Map, pixel: number[]) {
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
