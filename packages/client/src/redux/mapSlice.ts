// redux/mapSlice
/**
 * Stores various map parameters that the user can change
 * and/or that we wish to store and/or restore.
 * 
 * Center could be inferred from bounds, but for now is set.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { FeatureCollection } from './reducers';

import config from '@ufo-monorepo-test/config/src';
import { MapDictionary, QueryParams } from '@ufo-monorepo-test/common-types/src';

import type { AppThunk } from './store';
import type { MapState } from './reducers';

export interface FeatureCollectionResponse {
  results: FeatureCollection;
  dictionary: MapDictionary | undefined;
}

const searchEndpoint = config.api.host + ':' + config.api.port + config.api.endopoint.search;

const initialState: MapState = {
  featureCollection: null,
  zoom: 5,
  center: [19, 63.5],
  bounds: null,
  dictionary: undefined,
};

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    setMapParams(state, action: PayloadAction<{ center: [number, number]; zoom: number; bounds: [number, number, number, number] }>) {
      state.center = action.payload.center;
      state.zoom = action.payload.zoom;
      state.bounds = action.payload.bounds; // minx, miny, maxx, maxy
    },
    setMapDataFromResponse(state, action: PayloadAction<FeatureCollectionResponse>) {
      state.featureCollection = action.payload.results as FeatureCollection;
      state.dictionary = action.payload.dictionary as MapDictionary;
    },
  },
});

export const { setMapParams, setMapDataFromResponse } = mapSlice.actions;

export const fetchFeatures = (): AppThunk<void> => async (dispatch, getState) => {
  const { zoom, bounds } = getState().map;
  if (!zoom || !bounds) return;

  try {
    const queryObject = {
      zoom: String(zoom),
      minlng: String(bounds[0]),
      minlat: String(bounds[1]),
      maxlng: String(bounds[2]),
      maxlat: String(bounds[3]),
      show_undated: String(true),
      show_invalid_dates: String(true),
    };
    const queryString = new URLSearchParams(queryObject);
    const response = await fetch(`${searchEndpoint}?${queryString}`);

    const data = await response.json(); // Parse the JSON response

    console.log('mapSlice.fetchData', queryObject, data);

    // Dispatch action to update the fetched data in the state
    dispatch(setMapDataFromResponse(data));
  }
  catch (error) {
    // TODO Handle errors
    console.error(error);
  }
};

export default mapSlice.reducer;

