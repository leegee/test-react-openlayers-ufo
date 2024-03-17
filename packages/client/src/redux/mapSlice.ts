// redux/mapSlice
/**
 * Stores various map parameters that the user can change
 * and/or that we wish to store and/or restore.
 * 
 * Center could be inferred from bounds, but for now is set.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import config from '@ufo-monorepo-test/config/src';
import { MapDictionary } from '@ufo-monorepo-test/common-types/src';

import type { AppThunk } from './store';
import type { MapState } from './reducers';
import { RootState } from './store';

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

export interface UfoFeatureCollection {
  type: "FeatureCollection";
  clusterCount: number;
  features: GeoJSONFeature[];
}

export interface FeatureCollectionResponse {
  results: UfoFeatureCollection;
  dictionary: MapDictionary | undefined;
}

const searchEndpoint = config.api.host + ':' + config.api.port + config.api.endopoint.search;

let timeoutId: ReturnType<typeof setTimeout> | null = null;

const initialState: MapState = {
  featureCollection: null,
  zoom: 5,
  center: config.gui.map.centre,
  bounds: null,
  dictionary: undefined,
  from_date: undefined,
  to_date: undefined,
  resultsCount: undefined,
  q: '',
  basemapSource: localStorage.getItem('basemap_source') || 'dark',
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
    setMapDataFromResponse(state, action: PayloadAction<FeatureCollectionResponse>) {
      state.resultsCount = action.payload.results && action.payload.results.features ? action.payload.results.features.length : 0;
      state.featureCollection = action.payload.results as UfoFeatureCollection;
      state.dictionary = action.payload.dictionary as MapDictionary;
    },
    setFromDate(state, action: PayloadAction<number | undefined>) {
      state.from_date = action.payload;
    },
    setToDate(state, action: PayloadAction<number | undefined>) {
      state.to_date = action.payload;
    },
    setQ(state, action: PayloadAction<string | undefined>) {
      state.q = action.payload ? action.payload.trim() : '';
    },
    setBasemapSource: (state, action) => {
      state.basemapSource = action.payload;
      localStorage.setItem('basemap_source', state.basemapSource);
    },
  },
});

const { setMapDataFromResponse } = mapSlice.actions;

export const { setMapParams, setFromDate, setToDate, setQ, setBasemapSource } = mapSlice.actions;

export const selectBasemapSource = (state: RootState) => state.map.basemapSource;

export const fetchFeatures = (): AppThunk<void> => async (dispatch, getState) => {
  const { zoom, bounds, from_date, to_date, q } = getState().map;

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
      ...(from_date !== undefined ? { from_date: String(from_date) } : {}),
      ...(to_date !== undefined ? { to_date: String(to_date) } : {}),
      ...(q !== '' ? { q: q } : {}),
    };

    const queryString = new URLSearchParams(queryObject);

    const debounceTimeout = config.api.fetchDebounceMs;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`${searchEndpoint}?${queryString}`);
        const data = await response.json();
        dispatch(setMapDataFromResponse(data));
      } catch (error) {
        // TODO: handle errors
        console.error(error);
      }
    }, debounceTimeout);
  }
  catch (error) {
    // TODO: Handle errors
    console.error(error);
  }
};

export default mapSlice.reducer;

