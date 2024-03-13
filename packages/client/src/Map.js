import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat, transformExtent } from 'ol/proj';
import { setMapParams, fetchData } from './redux/mapSlice';
import 'ol/ol.css';
import './Map.css';
const OpenLayersMap = () => {
    const mapRef = useRef(null);
    const dispatch = useDispatch();
    const { center, zoom, bounds } = useSelector((state) => state.map);
    useEffect(() => {
        let map = null;
        if (mapRef.current) {
            map = new Map({
                target: mapRef.current,
                view: new View({
                    center: fromLonLat(center),
                    zoom,
                }),
                layers: [
                    new TileLayer({
                        source: new OSM(),
                    }),
                ],
            });
            map.on('moveend', () => {
                if (!map) {
                    return;
                }
                const center = map.getView().getCenter();
                const zoom = map.getView().getZoom();
                const view = map.getView();
                const size = map.getSize();
                const bounds = transformExtent(view.calculateExtent(size), 'EPSG:3857', 'EPSG:4326');
                dispatch(setMapParams({ center, zoom, bounds }));
            });
        }
        return () => {
            if (map) {
                map.dispose();
            }
        };
    }, [dispatch]);
    useEffect(() => {
        dispatch(fetchData()); // ikr
    }, [dispatch, bounds, zoom]);
    return _jsx("div", { ref: mapRef, className: "map" });
};
export default OpenLayersMap;
