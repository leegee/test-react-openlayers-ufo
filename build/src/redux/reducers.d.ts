export interface MapData {
}
export interface MapState {
    center: [number, number];
    zoom: number;
    bounds: [number, number, number, number] | null;
    data: MapData | null;
}
declare const rootReducer: import("redux").Reducer<{
    map: MapState;
}, import("redux").UnknownAction, Partial<{
    map: MapState | undefined;
}>>;
export default rootReducer;
