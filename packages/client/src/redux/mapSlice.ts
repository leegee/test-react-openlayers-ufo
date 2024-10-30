// redux/mapSlice
/**
 * Stores various map parameters that the user can change
 * and/or that we wish to store and/or restore.
 * 
 * Center could be inferred from bounds, but for now is set.
 */

import { createAsyncThunk, createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import debounce from 'debounce';

import type { MapBaseLayerKeyType } from '../components/Map';
import config from '@ufo-monorepo/config';
import { FeatureSourceAttributeType, MapDictionaryType, UfoFeatureCollectionType, SearchResposneType } from '@ufo-monorepo/common-types';
import { RootState } from './store';
import { downloadCsvBlob } from '../lib/download-csv-blob';

export interface MapState {
  center: [number, number];
  zoom: number;
  bounds: [number, number, number, number] | null;
  featureCollection?: UfoFeatureCollectionType;
  dictionary?: MapDictionaryType;
  from_date?: number;
  to_date?: number;
  q?: string;
  basemapSource: string;
  previousQueryString: string;
  queryString: string;
  requestingCsv: boolean;
  requestingFeatures: boolean;
  source: FeatureSourceAttributeType;
}

const searchEndpoint = config.api.url as string + config.api.endpoints.search;

const initialState: MapState = {
  featureCollection: undefined,
  zoom: 5,
  center: config.gui.map.centre,
  bounds: null,
  dictionary: undefined,
  from_date: undefined,
  to_date: undefined,
  q: '',
  basemapSource: localStorage.getItem('basemap_source') ?? 'geo',
  previousQueryString: '',
  queryString: '',
  requestingFeatures: false,
  requestingCsv: false,
  source: 'not-specified',
};

const setQueryString = (state: MapState) => {
  const { zoom, bounds, from_date, to_date, q, source } = state;
  let returnedQueryString: string;

  if (!zoom || !bounds) {
    returnedQueryString = state.queryString;
    console.error('setQueryString: no bounds or zoom');
  }

  else {
    const queryObject = {
      zoom: String(zoom),
      minlng: String(bounds[0]),
      minlat: String(bounds[1]),
      maxlng: String(bounds[2]),
      maxlat: String(bounds[3]),
      source: String(source),
      ...(from_date !== undefined ? { from_date: String(from_date) } : {}),
      ...(to_date !== undefined ? { to_date: String(to_date) } : {}),
      ...(q !== '' ? { q: q } : {}),
    };
    returnedQueryString = new URLSearchParams(queryObject).toString();
  }

  return {
    previousQueryString: state.previousQueryString,
    queryString: returnedQueryString,
  };
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
    setFeatureCollection(state, action: PayloadAction<SearchResposneType>) {
      state.dictionary = action.payload.dictionary;
      state.featureCollection = action.payload.results;
      if ((state.featureCollection as any).features === null) {
        state.featureCollection.features = [];
      }
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
    setBasemapSource: (state, action: PayloadAction<MapBaseLayerKeyType>) => {
      state.basemapSource = action.payload;
      localStorage.setItem('basemap_source', state.basemapSource);
    },
    setSource: (state, action: PayloadAction<FeatureSourceAttributeType>) => {
      state.source = action.payload;
    },
    setPreviousQueryString: (state) => {
      state.previousQueryString = state.queryString;
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
    setRequestingFeatures: (state, action: PayloadAction<boolean>) => {
      state.requestingFeatures = action.payload;
    },
    failedFeaturesRequest: (state) => {
      state.featureCollection = undefined;
      state.previousQueryString = '';
      state.requestingFeatures = false;
      state.queryString = '';
    },
  },
});

export const {
  setMapParams,
  setQ, resetDates, setFromDate, setToDate,
  setBasemapSource, setSource,
} = mapSlice.actions;

export const selectBasemapSource = (state: RootState) => state.map.basemapSource as MapBaseLayerKeyType;

export const selectPointsCount = createSelector(
  (state: RootState) => state.map.featureCollection,
  (featureCollection: UfoFeatureCollectionType | undefined): number => featureCollection?.pointsCount ?? 0
);

export const selectClusterCount = createSelector(
  (state: RootState) => state.map.featureCollection,
  (featureCollection: UfoFeatureCollectionType | undefined) => featureCollection?.clusterCount ?? 0
);

const _fetchFeatures: any = createAsyncThunk<SearchResposneType, any, { state: RootState }>(
  'data/fetchData',
  async (_, { dispatch, getState }): Promise<SearchResposneType | any> => {
    const mapState = getState().map;
    if (mapState.requestingFeatures) {
      console.log('fetchFeatures - bail as already requesting');
      return;
    }
    const { previousQueryString, queryString } = setQueryString(mapState);

    if (!queryString) {
      console.debug('fetchFeatures - bail as no queryString');
      return;
    }

    if (previousQueryString === queryString) {
      console.debug('zoom', mapState.zoom);
      console.trace('fetchFeatures - bailing: this query is the same as the last', previousQueryString, queryString);
      return undefined;
    }

    console.debug(`fetchFeatures - calling ${searchEndpoint}`);

    dispatch(mapSlice.actions.setPreviousQueryString());
    dispatch(mapSlice.actions.setRequestingFeatures(true));

    let response;
    try {
      response = await fetch(`${searchEndpoint}?${queryString}`);
      const data = await response.json() as SearchResposneType;
      dispatch(mapSlice.actions.setFeatureCollection(data));
    }
    catch (error) {
      console.error(error);
      dispatch(mapSlice.actions.failedFeaturesRequest());
    }
    finally {
      dispatch(mapSlice.actions.setRequestingFeatures(false));
    }
  }
);

export const fetchFeatures = debounce(
  _fetchFeatures,
  Number(config.gui.apiRequests.debounceMs || 333),
  { immediate: true }
);

export const _fetchCsv: any = createAsyncThunk<any, any, { state: RootState }>(
  'data/fetchData',
  async (_, { dispatch, getState }): Promise<SearchResposneType | any> => {
    const mapState = getState().map;

    dispatch(mapSlice.actions.setCsvRequesting());

    const { queryString } = mapState;

    const requestOptions = {
      headers: {
        accept: 'text/csv',
      }
    };

    let response;
    try {
      response = await fetch(`${searchEndpoint}?${queryString}`, requestOptions);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${String(response.status)}`);
      }

      // Expose the CSV
      const blob = await response.blob();
      downloadCsvBlob(blob);
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

