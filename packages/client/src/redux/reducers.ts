// reducers.ts
import { combineReducers } from '@reduxjs/toolkit';
import mapReducer from './mapSlice';

export interface MapData {}

export interface MapState {
  center: [number, number]; 
  zoom: number;
  bounds: [number, number, number, number] | null; 
  data: MapData | null;
}

const rootReducer = combineReducers({
    map: mapReducer,
});

export default rootReducer;
