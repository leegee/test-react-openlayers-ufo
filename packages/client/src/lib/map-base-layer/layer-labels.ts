// layer-geo.ts

import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';

const geo = new TileLayer({
    source: new XYZ({
        url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png',
    }),
});

export default geo;

// attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
// subdomains: 'abcd',
