import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import config from '@ufo-monorepo-test/config/src';

export type PanelStateTypes = 'hidden' | 'narrow' | 'full';

const initialState: {
    locale: string,
    panel: PanelStateTypes,
} = {
    locale: config.locale,
    panel: 'hidden',
};

const localeSlice = createSlice({
    name: 'gui',
    initialState,
    reducers: {
        setLocale: (state, action) => {
            state.locale = action.payload;
        },
        setPanel: (state, action: PayloadAction<PanelStateTypes>) => {
            state.panel = action.payload;
            console.debug(`Set panel to '${state.panel}'`);
            if (state.panel as any === '') {
                console.trace('Set panel received an invalid value');
            }
        }
    },
});

export const { setLocale, setPanel } = localeSlice.actions;

export default localeSlice.reducer;
