import { createSlice, createAsyncThunk } from "./libs/redux-toolkit.js";
import { apiRequest } from "./api.js";

// Async thunk for fetching posts
export const fetchPosts = createAsyncThunk(
  "posts/fetchPosts",
  async (cursor = null, { rejectWithValue }) => {
    try {
      const endpoint = cursor
        ? `/posts?limit=20&cursor=${cursor}`
        : "/posts?limit=20";
      const response = await apiRequest(endpoint);
      const result = await response.json();
      if (!response.ok) {
        return rejectWithValue(result.error || "Failed to fetch posts");
      }
      return result.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for toggling a like on a post
export const toggleLike = createAsyncThunk(
  "posts/toggleLike",
  async ({ postId, isLiked }, { dispatch, rejectWithValue, getState }) => {
    // Optimistic update
    const originalPost = getState().posts.items.find((p) => p.id === postId);
    if (!originalPost) return rejectWithValue("Post not found");

    const updatedPost = {
      ...originalPost,
      likes_count: isLiked
        ? originalPost.likes_count - 1
        : originalPost.likes_count + 1,
      user_liked: !isLiked,
    };
    dispatch(postsSlice.actions.updatePost(updatedPost));

    try {
      const response = isLiked
        ? await apiRequest(`/likes?post_id=${postId}`, { method: "DELETE" })
        : await apiRequest("/likes", {
            method: "POST",
            body: JSON.stringify({ post_id: postId }),
          });

      const result = await response.json();
      if (!response.ok) {
        // Revert on failure
        dispatch(postsSlice.actions.updatePost(originalPost));
        return rejectWithValue(result.error || "Failed to toggle like");
      }
      return { postId, isLiked: !isLiked };
    } catch (error) {
      // Revert on failure
      dispatch(postsSlice.actions.updatePost(originalPost));
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for deleting a post
export const deletePost = createAsyncThunk(
  "posts/deletePost",
  async (postId, { dispatch, rejectWithValue, getState }) => {
    const originalPost = getState().posts.items.find((p) => p.id === postId);
    if (!originalPost) return rejectWithValue("Post not found");

    // Optimistic update: remove post from state
    dispatch(postsSlice.actions.removePost(postId));

    try {
      const response = await apiRequest(`/posts/${postId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        // Revert on failure: add post back to state
        dispatch(postsSlice.actions.addPost(originalPost));
        return rejectWithValue(errorData.error || "Failed to delete post");
      }
      return postId;
    } catch (error) {
      // Revert on failure: add post back to state
      dispatch(postsSlice.actions.addPost(originalPost));
      return rejectWithValue(error.message);
    }
  }
);

const postsSlice = createSlice({
  name: "posts",
  initialState: {
    items: [],
    loading: false,
    error: null,
    cursor: null,
    hasMore: true,
  },
  reducers: {
    updatePost: (state, action) => {
      const index = state.items.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    removePost: (state, action) => {
      state.items = state.items.filter((p) => p.id !== action.payload);
    },
    addPost: (state, action) => {
      state.items.unshift(action.payload); // Add to the beginning
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        if (action.meta.arg) {
          // arg is the cursor, so we are appending
          const newPosts = action.payload.posts.filter(
            (p) => !state.items.some((existing) => existing.id === p.id)
          );
          state.items.push(...newPosts);
        } else {
          // No cursor, so it's a fresh load
          state.items = action.payload.posts;
        }
        state.cursor = action.payload.next_cursor;
        state.hasMore = action.payload.has_more;
        state.loading = false;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(toggleLike.rejected, (state, action) => {
        console.error("Failed to toggle like:", action.payload);
      })
      .addCase(deletePost.rejected, (state, action) => {
        console.error("Failed to delete post:", action.payload);
        // The thunk already reverts the state, but we can show a toast here.
        // toast.error(action.payload); // Assuming toast is available globally
      });
  },
});

export const { updatePost, removePost, addPost } = postsSlice.actions;
export default postsSlice.reducer;
