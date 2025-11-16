/**
 * Authentication Slice
 * Manages user authentication state
 */

const AuthSlice = {
  name: "auth",

  initialState: {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    session: null,
  },

  reducers: {
    // Set user and authenticated state
    setUser: (state, action) => {
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
      };
    },

    // Clear user on logout
    clearUser: () => {
      return {
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        session: null,
      };
    },

    // Set loading state
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

    // Set session
    setSession: (state, action) => {
      return {
        ...state,
        session: action.payload,
      };
    },

    // Set loading and error together (for async operations)
    setAsyncState: (state, action) => {
      return {
        ...state,
        loading: action.payload.loading,
        error: action.payload.error,
      };
    },
  },

  extraReducers: (builder) => {
    // Async action handlers would go here
  },
};

// Thunk actions for async operations
const authThunks = {
  loginUser: async (credentials) => {
    return async (dispatch) => {
      dispatch({ type: "auth/setLoading", payload: true });
      try {
        const response = await apiRequest("/auth/login", {
          method: "POST",
          body: JSON.stringify(credentials),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Login failed");
        }

        // Store session
        localStorage.setItem("supabaseSession", JSON.stringify(data.session));
        dispatch({ type: "auth/setUser", payload: data.user });
        dispatch({ type: "auth/setSession", payload: data.session });
        dispatch({
          type: "auth/setAsyncState",
          payload: { loading: false, error: null },
        });

        return data.user;
      } catch (error) {
        dispatch({
          type: "auth/setAsyncState",
          payload: { loading: false, error: error.message },
        });
        throw error;
      }
    };
  },

  signupUser: async (userData) => {
    return async (dispatch) => {
      dispatch({ type: "auth/setLoading", payload: true });
      try {
        const response = await apiRequest("/auth/signup", {
          method: "POST",
          body: JSON.stringify(userData),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Signup failed");
        }

        dispatch({
          type: "auth/setAsyncState",
          payload: { loading: false, error: null },
        });
        return data;
      } catch (error) {
        dispatch({
          type: "auth/setAsyncState",
          payload: { loading: false, error: error.message },
        });
        throw error;
      }
    };
  },

  logoutUser: async () => {
    return async (dispatch) => {
      try {
        await apiRequest("/auth/logout", { method: "POST" });
        localStorage.removeItem("supabaseSession");
        dispatch({ type: "auth/clearUser" });
      } catch (error) {
        console.error("Logout error:", error);
      }
    };
  },

  getCurrentUser: async () => {
    return async (dispatch) => {
      try {
        const session = JSON.parse(localStorage.getItem("supabaseSession"));
        if (!session) {
          dispatch({ type: "auth/clearUser" });
          return null;
        }

        const response = await apiRequest(`/profile/${session.user.id}`);
        const data = await response.json();

        if (response.ok) {
          dispatch({ type: "auth/setUser", payload: data.data || data });
          return data.data || data;
        } else {
          throw new Error("Failed to fetch current user");
        }
      } catch (error) {
        dispatch({ type: "auth/clearUser" });
        return null;
      }
    };
  },
};

// Export
if (typeof module !== "undefined" && module.exports) {
  module.exports = { AuthSlice, authThunks };
}
