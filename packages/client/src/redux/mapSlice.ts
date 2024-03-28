// redux/mapSlice
/**
 * Stores various map parameters that the user can change
 * and/or that we wish to store and/or restore.
 * 
 * Center could be inferred from bounds, but for now is set.
 */

import { createAsyncThunk, createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import debounce from 'debounce';

import config from '@ufo-monorepo-test/config/src';
import { MapDictionary } from '@ufo-monorepo-test/common-types/src';
import type { MapBaseLayerKeyType } from '../Map';
import { RootState } from './store';
import { FeatureLike } from 'ol/Feature';

export interface UfoJsonFeature {
  properties: {
    [key: string]: any;
  };
}

export interface UfoFeatureCollection {
  clusterCount: number;
  pointsCount: number;
  features: UfoJsonFeature[];
}

// Extend QueryParams 
export interface MapState {
  center: [number, number];
  zoom: number;
  bounds: [number, number, number, number] | null;
  featureCollection: UfoFeatureCollection | null;
  dictionary: MapDictionary | undefined;
  from_date?: number;
  to_date?: number;
  q?: string;
  basemapSource: string;
  previousQueryString: string;
  requestingCsv: boolean;
  updateMap: boolean;
  loading: boolean;
  loadingPc: number;
}

const searchEndpoint = config.api.host + ':' + config.api.port + config.api.endopoints.search.url;

const initialState: MapState = {
  featureCollection: null,
  zoom: 5,
  center: config.gui.map.centre,
  bounds: null,
  dictionary: undefined,
  from_date: undefined,
  to_date: undefined,
  q: '',
  basemapSource: localStorage.getItem('basemap_source') || 'geo',
  previousQueryString: '',
  requestingCsv: false,
  updateMap: false,
  loading: false,
  loadingPc: 0,

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
    resetFeatureCollection(state) {
      state.featureCollection = {
        clusterCount: 0,
        pointsCount: 0,
        features: []
      };
      console.log('init');
    },

    addPropretiesToFeatureCollection(state, action: PayloadAction<UfoJsonFeature[]>) {
      state.featureCollection?.features.push(...action.payload);
      console.log('added', [...action.payload].length, [...action.payload])
    },

    finaliseFeatureCollection(state) {
      state.featureCollection = {
        clusterCount: state.featureCollection ? state.featureCollection.features.filter(feature => feature.properties && feature.properties.layer === 'sighting_clusters').length : 0,
        pointsCount: state.featureCollection ? state.featureCollection.features.filter(feature => feature.properties && feature.properties.layer === 'sighting_points').length : 0,
        features: state.featureCollection?.features ?? []
      };
      console.log('fin', state.featureCollection)
    },

    resetDates(state) {
      state.from_date = undefined;
      state.to_date = undefined;
      console.log('reset dates')
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
    setCsvRequesting: (state) => {
      state.requestingCsv = true;
    },
    csvRequestDone: (state) => {
      state.requestingCsv = false;
    },
    csvRequestFailed: (state) => {
      state.requestingCsv = false;
    },
    failedRequest: (state) => {
      state.featureCollection = null;
      state.previousQueryString = '';
    },
    setUpdateMap: (state, action: PayloadAction<boolean>) => {
      state.updateMap = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setLoadingPc: (state, action: PayloadAction<number>) => {
      state.loadingPc = action.payload;
    },
  },
});

export const {
  addPropretiesToFeatureCollection, resetFeatureCollection, finaliseFeatureCollection,
  setPreviousQueryString, setMapParams,
  resetDates, setFromDate, setToDate,
  setQ, setBasemapSource,
  setUpdateMap,
  setLoading, setLoadingPc
} = mapSlice.actions;

export const selectBasemapSource = (state: RootState) => state.map.basemapSource as MapBaseLayerKeyType;

export const selectPointsCount = createSelector(
  (state: RootState) => state.map.featureCollection,
  (featureCollection) => featureCollection?.pointsCount ?? 0
);

export const selectClusterCount = createSelector(
  (state: RootState) => state.map.featureCollection,
  (featureCollection) => featureCollection?.clusterCount ?? 0
);

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

export const selectMvtQueryString = (mapState: MapState): string | undefined => {
  const { zoom, bounds, from_date, to_date, q } = mapState;
  if (!zoom || !bounds) return;

  const queryObject = {
    ...(from_date !== undefined ? { from_date: String(from_date) } : {}),
    ...(to_date !== undefined ? { to_date: String(to_date) } : {}),
    ...(q !== '' ? { q: q } : {}),
  };
  return new URLSearchParams(queryObject).toString();
};

const _fetchCsv: any = createAsyncThunk<any, any, { state: RootState }>(
  'data/fetchData',
  async (_, { dispatch, getState }): Promise<any | any> => {
    const mapState = getState().map;

    dispatch(mapSlice.actions.setCsvRequesting());

    const queryString: string | undefined = selectQueryString(mapState);

    const requestOptions = {
      headers: {
        accept: 'text/csv',
      }
    };

    let response;
    try {
      response = await fetch(`${searchEndpoint}?${queryString}`, requestOptions);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Expose the CSV
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'data.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      dispatch(mapSlice.actions.csvRequestDone());
    }
    catch (error) {
      console.error(error);
      dispatch(mapSlice.actions.csvRequestFailed());
    }
  }
);

export const fetchCsv = debounce(
  _fetchCsv,
  config.gui.apiRequests.debounceMs * 10,
  { immediate: true }
);

export default mapSlice.reducer;

