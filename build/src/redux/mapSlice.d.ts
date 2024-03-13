/**
 * Stores various map parameters that the user can change
 * and/or that we wish to store and/or restore.
 *
 * Center could be inferred from bounds, but for now is set.
 */
import type { AppThunk } from './store';
import type { MapState, MapData } from './reducers';
export declare const setMapParams: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    center: [number, number];
    zoom: number;
    bounds: [number, number, number, number];
}, "map/setMapParams">, setMapData: import("@reduxjs/toolkit").ActionCreatorWithPayload<MapData, "map/setMapData">;
export declare const fetchData: () => AppThunk<void>;
declare const _default: import("redux").Reducer<MapState>;
export default _default;
