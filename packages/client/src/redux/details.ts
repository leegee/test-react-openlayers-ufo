import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { FetchSightingDetailsResponse, SightingRecordType } from '@ufo-monorepo-test/common-types/src';
import config from '@ufo-monorepo-test/config/src';

export interface SightingDetailsState {
    id: string | undefined;
    loading: boolean;
    error: string | null;
    details: SightingRecordType
    // Add other fields as needed
}

const detailsEndpoint = config.api.host + ':' + config.api.port + config.api.endopoints.details;

const initialState: SightingDetailsState = {
    id: undefined,
    loading: false,
    error: null,
    details: {}
};

export const fetchSightingDetails: any = createAsyncThunk<
    FetchSightingDetailsResponse,
    string, // Type of the id param
    { rejectValue: string | Error }
>(
    'sightingDetails/fetchSightingDetails',
    async (id: string, thunkAPI) => {
        try {
            const response = await fetch(`${detailsEndpoint}/${id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }
            const data = await response.json();
            return data;
        }
        catch (error) {
            return thunkAPI.rejectWithValue((error as Error).message);
        }
    }
);

const detailsSlice = createSlice({
    name: 'sightingDetails',
    initialState,
    reducers: {
        setId: (state, action) => {
            state.id = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSightingDetails.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSightingDetails.fulfilled, (state, action) => {
                state.loading = false;
                state.details = action.payload.details;
            })
            .addCase(fetchSightingDetails.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { setId } = detailsSlice.actions;

export default detailsSlice.reducer;
