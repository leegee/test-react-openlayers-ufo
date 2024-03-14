// redux/mapSlice
/**
 * Stores various map parameters that the user can change
 * and/or that we wish to store and/or restore.
 * 
 * Center could be inferred from bounds, but for now is set.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import config from '@ufo-monorepo-test/config/src';

import type { AppThunk } from './store';
import type { MapState, MapData } from './reducers';

const searchEndpoint = config.api.host + ':' + config.api.port + config.api.endopoint.search;

const initialState: MapState = {
  data: null,
  zoom: 5,
  center: [12, 59],
  bounds: null,
};

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    setMapParams(state, action: PayloadAction<{ center: [number, number]; zoom: number; bounds: [number, number, number, number] }>) {
      state.center = action.payload.center;
      state.zoom = action.payload.zoom;
      state.bounds = action.payload.bounds;
    },
    setMapData(state, action: PayloadAction<MapData>) {
      state.data = action.payload;
    },
  },
});

export const { setMapParams, setMapData } = mapSlice.actions;

export const fetchData = (): AppThunk<void> => async (dispatch, getState) => {
  const { zoom, bounds } = getState().map;
  if (!zoom || !bounds) {
    return;
  }

  try {
    const [minlng, minlat, maxlng, maxlat] = bounds;
    const queryObject = {
      zoom: zoom.toString(),
      minlng: String(minlng),
      minlat: String(minlat),
      maxlng: String(maxlng),
      maxlat: String(maxlat),
    };
    const queryString = new URLSearchParams(queryObject);
    const response = await fetch(`${searchEndpoint}?${queryString}`);

    const data = await response.json(); // Parse the JSON response

    console.log('mapSlice.fetchData', queryObject, data);

    // Dispatch action to update the fetched data in the state
    dispatch(setMapData(data));
  }
  catch (error) {
    // TODO Handle errors
    console.error(error);
  }
};

export default mapSlice.reducer;

