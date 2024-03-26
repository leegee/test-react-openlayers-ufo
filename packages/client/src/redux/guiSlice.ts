import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import config from '@ufo-monorepo-test/config/src';

export type PanelStateTypes = 'hidden' | 'narrow' | 'full';

export type GuiSliceType = {
    locale: string,
    panel: PanelStateTypes,
    selectionId: number | undefined,
};

const initialState: GuiSliceType = {
    locale: config.locale,
    panel: 'hidden',
    selectionId: undefined
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
        },
        setSelectionId: (state, action) => {
            state.selectionId = action.payload;
        }
    },
});

export const { setLocale, setPanel, setSelectionId } = localeSlice.actions;

export default localeSlice.reducer;
