// reducers.ts
import { combineReducers } from '@reduxjs/toolkit';
import mapReducer, { UfoFeatureCollection } from './mapSlice';
import { MapDictionary } from '@ufo-monorepo-test/common-types/src';

export interface MapState {
  center: [number, number];
  zoom: number;
  bounds: [number, number, number, number] | null;
  featureCollection: UfoFeatureCollection | null;
  resultsCount: number | undefined;
  dictionary: MapDictionary | undefined;
  from_date?: number;
  to_date?: number;
  q?: string;
  basemapSource: string;
}

const rootReducer = combineReducers({
  map: mapReducer,
});

export default rootReducer;
