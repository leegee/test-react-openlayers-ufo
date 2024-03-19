// redux/mapSlice
/**
 * Stores various map parameters that the user can change
 * and/or that we wish to store and/or restore.
 * 
 * Center could be inferred from bounds, but for now is set.
 */

import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import config from '@ufo-monorepo-test/config/src';
import { MapDictionary } from '@ufo-monorepo-test/common-types/src';

import type { MapBaseLayerKeyType } from '../Map';
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

export interface FetchFeaturesResposneType {
  results: UfoFeatureCollection;
  dictionary: MapDictionary | undefined;
}

// Extend QueryParams 
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
  previousQueryString: string;
}

const searchEndpoint = config.api.host + ':' + config.api.port + config.api.endopoint.search;

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
  previousQueryString: '',
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
    setFeatureCollection(state, action: PayloadAction<FetchFeaturesResposneType>) {
      state.resultsCount = action.payload.results && action.payload.results.features ? action.payload.results.features.length : 0;
      state.featureCollection = (action.payload.results || []) as UfoFeatureCollection;
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
    setPreviousQueryString: (state, action) => {
      state.previousQueryString = action.payload;
    },
    failedRequest: (state, _action) => {
      state.resultsCount = 0;
      state.featureCollection = null;
      state.previousQueryString = '';
      // action.payload.status etc
    }
  },
});

export const { setPreviousQueryString, setMapParams, setFromDate, setToDate, setQ, setBasemapSource } = mapSlice.actions;

export const selectBasemapSource = (state: RootState) => state.map.basemapSource as MapBaseLayerKeyType;

export const selectQueryString = (mapState: MapState): string | undefined => {
  const { zoom, bounds, from_date, to_date, q } = mapState;
  if (!zoom || !bounds) return;

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

  return new URLSearchParams(queryObject).toString();
};


export const fetchFeatures: any = createAsyncThunk<FetchFeaturesResposneType, void, { state: RootState }>(
  'data/fetchData',
  async (_, { dispatch, getState }): Promise<FetchFeaturesResposneType | any> => {
    const mapState = getState().map;
    const queryString: string | undefined = selectQueryString(mapState);
    const { previousQueryString } = mapState;

    if (!queryString) return;

    if (previousQueryString === queryString) {
      console.log('fetchFeatures - bail, this request query same as last request query');
      return undefined;
    }
    dispatch(setPreviousQueryString(queryString));

    let response;
    try {
      response = await fetch(`${searchEndpoint}?${queryString}`);
      const data = await response.json();
      dispatch(mapSlice.actions.setFeatureCollection(data));
    }
    catch (error) {
      console.error(error);
      dispatch(mapSlice.actions.failedRequest(response));
    }
  }
);

export default mapSlice.reducer;

