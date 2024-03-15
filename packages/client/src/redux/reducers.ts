// reducers.ts
import { combineReducers } from '@reduxjs/toolkit';
import mapReducer from './mapSlice';
import { MapDictionary } from '@ufo-monorepo-test/common-types/src';

export interface GeoJSONFeature {
  type: "Feature";
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
  properties: {
    [key: string]: any;
  };
}

export interface FeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

export interface MapState {
  center: [number, number];
  zoom: number;
  bounds: [number, number, number, number] | null;
  featureCollection: FeatureCollection | null;
  resultsCount: number | undefined;
  dictionary: MapDictionary | undefined;
  from_date?: number;
  to_date?: number;
}

const rootReducer = combineReducers({
  map: mapReducer,
});

export default rootReducer;
