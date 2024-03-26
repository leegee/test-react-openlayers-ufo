// https://openlayers.org/workshop/en/webgl/points.html

import GeoJSON from 'ol/format/GeoJSON';
import Vector from 'ol/source/Vector';
import WebGLPointsLayer from 'ol/layer/WebGLPoints';
import Layer from 'ol/layer/Layer';
import { UfoFeatureCollection } from 'redux/mapSlice';


export const vectorSource = new Vector({
    url: 'data/geojson/world-cities.geojson',
    format: new GeoJSON(),
    wrapX: true,
});

/*
map.on('pointermove', function (ev) {
    if (selected !== null) {
        selected.set('hover', 0);
        selected = null;
    }

    map.forEachFeatureAtPixel(ev.pixel, function (feature) {
        feature.set('hover', 1);
        selected = feature;
        return true;
    });
});
*/

export const webGlLayer = new WebGLPointsLayer({
    source: vectorSource,
    style: {
        'circle-radius': 5,
        'circle-fill-color': '#44F',
        'circle-rotate-with-view': false,
        'circle-displacement': [0, 0],
        'circle-opacity': 0.6,
    },
});

// function animate() {
//     map.render();
//     window.requestAnimationFrame(animate);
// }
// animate();

export function updateWebGlLayer(featureCollection: UfoFeatureCollection) {
    vectorSource.clear();
    if (featureCollection.features) {
        vectorSource.addFeatures(new GeoJSON().readFeatures(featureCollection));
    }
    vectorSource.changed();
    console.debug("Number of features added:", vectorSource.getFeatures().length);
}
