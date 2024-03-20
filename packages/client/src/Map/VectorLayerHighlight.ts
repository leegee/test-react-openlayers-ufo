// map/VectorlayerHighlight

import type { Map } from 'ol';
import Feature from 'ol/Feature';
import { Geometry } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Stroke } from 'ol/style';

const featureSource = new VectorSource();

const featureOverlay = new VectorLayer({
    source: featureSource,
    style: (_feature) => {
        return new Style({
            stroke: new Stroke({
                color: 'yellow',
                width: 14,
            }),
        });
    },
});

let highlight: Feature<Geometry>;

export function useFeatureHighlighting(map: Map) {
    featureOverlay.setVisible(true);
    featureOverlay.setZIndex(100);
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
            featureSource.removeFeature(highlight);
        }
        if (feature) {
            console.log('highlight', feature);
            featureSource.addFeature(feature as Feature<Geometry>);
        }
        highlight = feature as Feature<Geometry>;
    }
}
