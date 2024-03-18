// reducers.ts
import { combineReducers } from '@reduxjs/toolkit';
import mapReducer from './mapSlice';

const rootReducer = combineReducers({
  map: mapReducer,
});

export default rootReducer;
