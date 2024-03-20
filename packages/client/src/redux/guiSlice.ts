import { createSlice } from '@reduxjs/toolkit';
import config from '@ufo-monorepo-test/config/src';

const initialState: {
    locale: string,
} = {
    locale: config.locale,
};

const localeSlice = createSlice({
    name: 'gui',
    initialState,
    reducers: {
        setLocale: (state, action) => {
            state.locale = action.payload;
        },
    },
});

export const { setLocale } = localeSlice.actions;

export default localeSlice.reducer;
