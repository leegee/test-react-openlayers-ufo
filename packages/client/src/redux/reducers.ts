// reducers.ts
import { combineReducers } from '@reduxjs/toolkit';
import mapReducer from './mapSlice';
import guiReducer from './guiSlice';

const rootReducer = combineReducers({
  map: mapReducer,
  gui: guiReducer,
});

export default rootReducer;
