/**
 * Posts Slice
 * Manages posts state and pagination
 */

const PostsSlice = {
  name: "posts",

  initialState: {
    items: [],
    loading: false,
    error: null,
    cursor: null,
    hasMore: true,
    currentPost: null,
  },

  reducers: {
    // Set posts (replace all)
    setPosts: (state, action) => {
      return {
        ...state,
        items: action.payload,
      };
    },

    // Append posts (pagination)
    appendPosts: (state, action) => {
      return {
        ...state,
        items: [...state.items, ...action.payload],
      };
    },

    // Add single post
    addPost: (state, action) => {
      return {
        ...state,
        items: [action.payload, ...state.items],
      };
    },

    // Update post by ID
    updatePost: (state, action) => {
      const { id, updates } = action.payload;
      return {
        ...state,
        items: state.items.map((post) =>
          post.id === id ? { ...post, ...updates } : post
        ),
        currentPost:
          state.currentPost?.id === id
            ? { ...state.currentPost, ...updates }
            : state.currentPost,
      };
    },

    // Remove post by ID
    removePost: (state, action) => {
      return {
        ...state,
        items: state.items.filter((post) => post.id !== action.payload),
      };
    },

    // Set current post
    setCurrentPost: (state, action) => {
      return {
        ...state,
        currentPost: action.payload,
      };
    },

    // Clear current post
    clearCurrentPost: (state) => {
      return {
        ...state,
        currentPost: null,
      };
    },

    // Set cursor for pagination
    setCursor: (state, action) => {
      return {
        ...state,
        cursor: action.payload,
      };
    },

    // Set has more for pagination
    setHasMore: (state, action) => {
      return {
        ...state,
        hasMore: action.payload,
      };
    },

    // Set loading
    setLoading: (state, action) => {
      return {
        ...state,
        loading: action.payload,
      };
    },

    // Set error
    setError: (state, action) => {
      return {
        ...state,
        error: action.payload,
      };
    },

    // Clear error
    clearError: (state) => {
      return {
        ...state,
        error: null,
      };
    },

    // Update post comment count
    updateCommentCount: (state, action) => {
      const { postId, delta } = action.payload;
      return {
        ...state,
        items: state.items.map((post) =>
          post.id === postId
            ? { ...post, comments_count: (post.comments_count || 0) + delta }
            : post
        ),
      };
    },

    // Update post like count
    updateLikeCount: (state, action) => {
      const { postId, delta } = action.payload;
      return {
        ...state,
        items: state.items.map((post) =>
          post.id === postId
            ? { ...post, likes_count: (post.likes_count || 0) + delta }
            : post
        ),
      };
    },
  },
};

// Thunk actions for async operations
const postsThunks = {
  fetchPosts: async (cursor = null) => {
    return async (dispatch) => {
      dispatch({ type: "posts/setLoading", payload: true });
      try {
        const endpoint = cursor
          ? `/posts?limit=20&cursor=${cursor}`
          : "/posts?limit=20";

        const response = await apiRequest(endpoint);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to fetch posts");
        }

        if (cursor) {
          dispatch({ type: "posts/appendPosts", payload: result.data.posts });
        } else {
          dispatch({ type: "posts/setPosts", payload: result.data.posts });
        }

        dispatch({ type: "posts/setCursor", payload: result.data.next_cursor });
        dispatch({ type: "posts/setHasMore", payload: result.data.has_more });
        dispatch({ type: "posts/setLoading", payload: false });

        return result.data;
      } catch (error) {
        dispatch({ type: "posts/setError", payload: error.message });
        dispatch({ type: "posts/setLoading", payload: false });
        throw error;
      }
    };
  },

  fetchFollowingPosts: async (cursor = null) => {
    return async (dispatch) => {
      dispatch({ type: "posts/setLoading", payload: true });
      try {
        const endpoint = cursor
          ? `/posts/following?limit=20&cursor=${cursor}`
          : "/posts/following?limit=20";

        const response = await apiRequest(endpoint);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to fetch posts");
        }

        if (cursor) {
          dispatch({ type: "posts/appendPosts", payload: result.data.posts });
        } else {
          dispatch({ type: "posts/setPosts", payload: result.data.posts });
        }

        dispatch({ type: "posts/setCursor", payload: result.data.next_cursor });
        dispatch({ type: "posts/setHasMore", payload: result.data.has_more });
        dispatch({ type: "posts/setLoading", payload: false });

        return result.data;
      } catch (error) {
        dispatch({ type: "posts/setError", payload: error.message });
        dispatch({ type: "posts/setLoading", payload: false });
        throw error;
      }
    };
  },

  createPost: async (postData) => {
    return async (dispatch) => {
      dispatch({ type: "posts/setLoading", payload: true });
      try {
        const response = await apiRequest("/posts", {
          method: "POST",
          body: JSON.stringify(postData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to create post");
        }

        dispatch({ type: "posts/addPost", payload: result.data });
        dispatch({ type: "posts/setLoading", payload: false });

        return result.data;
      } catch (error) {
        dispatch({ type: "posts/setError", payload: error.message });
        dispatch({ type: "posts/setLoading", payload: false });
        throw error;
      }
    };
  },

  deletePost: async (postId) => {
    return async (dispatch) => {
      try {
        const response = await apiRequest(`/posts/${postId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || "Failed to delete post");
        }

        dispatch({ type: "posts/removePost", payload: postId });
        return true;
      } catch (error) {
        dispatch({ type: "posts/setError", payload: error.message });
        throw error;
      }
    };
  },

  toggleLike: async (postId, isLiked) => {
    return async (dispatch) => {
      try {
        let response;
        if (isLiked) {
          response = await apiRequest(`/likes?post_id=${postId}`, {
            method: "DELETE",
          });
        } else {
          response = await apiRequest("/likes", {
            method: "POST",
            body: JSON.stringify({ post_id: postId }),
          });
        }

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || "Failed to toggle like");
        }

        const delta = isLiked ? -1 : 1;
        dispatch({ type: "posts/updateLikeCount", payload: { postId, delta } });

        return true;
      } catch (error) {
        dispatch({ type: "posts/setError", payload: error.message });
        throw error;
      }
    };
  },
};

// Export
if (typeof module !== "undefined" && module.exports) {
  module.exports = { PostsSlice, postsThunks };
}
