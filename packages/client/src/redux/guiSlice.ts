import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import config from '@ufo-monorepo/config';

export type PanelStateTypes = 'hidden' | 'narrow' | 'full';

export interface GuiSliceType {
    locale: string,
    panel: PanelStateTypes,
    selectionId: number | undefined,
    showLabels: boolean;
}

const initialState: GuiSliceType = {
    locale: config.locale,
    panel: 'hidden',
    selectionId: undefined,
    showLabels: localStorage.getItem('showlabels') === 'no' ? false : true,
};

const localeSlice = createSlice({
    name: 'gui',
    initialState,
    reducers: {
        setLocaleKey: (state, action: PayloadAction<string>) => {
            state.locale = action.payload;
        },
        setPanel: (state, action: PayloadAction<PanelStateTypes>) => {
            state.panel = action.payload;
            console.debug(`Set panel to '${state.panel}'`);
            if (state.panel as any === '') {
                console.trace('Set panel received an invalid value');
            }
        },
        setSelectionId: (state, action: PayloadAction<number | undefined>) => {
            state.selectionId = action.payload;
        },
        setShowLabels: (state, action: PayloadAction<boolean>) => {
            state.showLabels = action.payload;
            localStorage.setItem('showlabels', action.payload ? 'yes' : 'no');
        }
    },
});

export const { setLocaleKey, setPanel, setSelectionId, setShowLabels } = localeSlice.actions;

export default localeSlice.reducer;
