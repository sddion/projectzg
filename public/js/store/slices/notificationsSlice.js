/**
 * Notifications Slice
 * Manages notifications state
 */

const NotificationsSlice = {
  name: "notifications",

  initialState: {
    items: [],
    unreadCount: 0,
    loading: false,
    error: null,
  },

  reducers: {
    // Set notifications
    setNotifications: (state, action) => {
      return {
        ...state,
        items: action.payload,
      };
    },

    // Add notification
    addNotification: (state, action) => {
      return {
        ...state,
        items: [action.payload, ...state.items],
        unreadCount: state.unreadCount + 1,
      };
    },

    // Mark as read
    markAsRead: (state, action) => {
      const notificationId = action.payload;
      const notification = state.items.find((n) => n.id === notificationId);

      if (notification && !notification.is_read) {
        return {
          ...state,
          items: state.items.map((n) =>
            n.id === notificationId ? { ...n, is_read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        };
      }
      return state;
    },

    // Mark all as read
    markAllAsRead: (state) => {
      return {
        ...state,
        items: state.items.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0,
      };
    },

    // Set unread count
    setUnreadCount: (state, action) => {
      return {
        ...state,
        unreadCount: action.payload,
      };
    },

    // Remove notification
    removeNotification: (state, action) => {
      return {
        ...state,
        items: state.items.filter((n) => n.id !== action.payload),
      };
    },

    // Clear all notifications
    clearNotifications: () => {
      return {
        items: [],
        unreadCount: 0,
        loading: false,
        error: null,
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
  },
};

// Thunk actions
const notificationsThunks = {
  fetchNotifications: async () => {
    return async (dispatch) => {
      dispatch({ type: "notifications/setLoading", payload: true });
      try {
        const response = await apiRequest("/notifications");
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to fetch notifications");
        }

        dispatch({
          type: "notifications/setNotifications",
          payload: result.data,
        });

        const unreadCount = result.data.filter((n) => !n.is_read).length;
        dispatch({
          type: "notifications/setUnreadCount",
          payload: unreadCount,
        });
        dispatch({ type: "notifications/setLoading", payload: false });

        return result.data;
      } catch (error) {
        dispatch({ type: "notifications/setError", payload: error.message });
        dispatch({ type: "notifications/setLoading", payload: false });
        throw error;
      }
    };
  },

  markNotificationAsRead: async (notificationId) => {
    return async (dispatch) => {
      try {
        const response = await apiRequest(
          `/notifications/${notificationId}/read`,
          {
            method: "PUT",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to mark notification as read");
        }

        dispatch({ type: "notifications/markAsRead", payload: notificationId });
        return true;
      } catch (error) {
        dispatch({ type: "notifications/setError", payload: error.message });
        throw error;
      }
    };
  },

  markAllNotificationsAsRead: async () => {
    return async (dispatch) => {
      try {
        const response = await apiRequest("/notifications/read-all", {
          method: "PUT",
        });

        if (!response.ok) {
          throw new Error("Failed to mark all notifications as read");
        }

        dispatch({ type: "notifications/markAllAsRead" });
        return true;
      } catch (error) {
        dispatch({ type: "notifications/setError", payload: error.message });
        throw error;
      }
    };
  },
};

// Export
if (typeof module !== "undefined" && module.exports) {
  module.exports = { NotificationsSlice, notificationsThunks };
}
