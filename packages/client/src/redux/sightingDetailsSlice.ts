import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import config from '@ufo-monorepo-test/config/src';

interface SightingDetailsState {
    id: string | undefined;
    loading: boolean;
    error: string | null;
    // Add other fields as needed
}

const initialState: SightingDetailsState = {
    id: undefined,
    loading: false,
    error: null,
};


interface FetchSightingDetailsResponse {
    detail: {
        [key: string]: string | number | undefined | null
    }
}

export const fetchSightingDetails = createAsyncThunk<
    FetchSightingDetailsResponse,
    string, // Type of the id param
    { rejectValue: string }
>(
    'sightingDetails/fetchSightingDetails',
    async (id: string, thunkAPI) => {
        try {
            const response = await fetch(`${config.api.endopoints.details}/${id}`);
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

const sightingDetailsSlice = createSlice({
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
                // state.details = action.payload;
            })
            .addCase(fetchSightingDetails.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { setId } = sightingDetailsSlice.actions;

export default sightingDetailsSlice.reducer;
