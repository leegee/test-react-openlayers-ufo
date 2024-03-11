import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { type AppThunk } from './store';

interface MapData {}

interface MapState {
  center: [number, number];
  zoom: number;
  bounds: [number, number, number, number] | null; 
  data: MapData | null;
}

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
    setCenterAndZoom(state, action: PayloadAction<{ center: [number, number]; zoom: number; bounds: [number, number, number, number] }>) {
      state.center = action.payload.center;
      state.zoom = action.payload.zoom;
      state.bounds = action.payload.bounds;
    },
    setData(state, action: PayloadAction<MapData>) {
      state.data = action.payload;
    },
  },
});

export const { setCenterAndZoom, setData } = mapSlice.actions;

export const fetchData = (): AppThunk => async (dispatch, getState) => {
  try {
    const { zoom, bounds } = getState().map;
    if (!zoom || !bounds) {
      return;
    }
    console.log('mapSlice.fetchData for', zoom, bounds)
    const response = await fetch(`?zoom=${zoom}&bounds=${bounds!.join(',')}`);
    const data = await response.json(); // Parse the JSON response

    // Dispatch action to update the fetched data in the state
    dispatch(setData(data));
  } catch (error) {
    // Handle errors
  }
};

export default mapSlice.reducer;

