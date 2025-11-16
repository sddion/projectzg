import { createSlice, createAsyncThunk } from "./libs/redux-toolkit.js";
import { apiRequest } from "./api.js";

// Async thunk for creating a story
export const createStory = createAsyncThunk(
  "stories/createStory",
  async (storyData, { rejectWithValue }) => {
    try {
      const response = await apiRequest("/stories", {
        method: "POST",
        body: JSON.stringify(storyData),
      });
      const result = await response.json();
      if (!response.ok) {
        return rejectWithValue(result.error || "Failed to create story");
      }
      return result.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const storiesSlice = createSlice({
  name: "stories",
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    // Reducers for fetching/deleting stories can be added here later
  },
  extraReducers: (builder) => {
    builder
      .addCase(createStory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createStory.fulfilled, (state, action) => {
        state.items.unshift(action.payload); // Add new story to the beginning
        state.loading = false;
      })
      .addCase(createStory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default storiesSlice.reducer;
