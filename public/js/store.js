// Simple State Management System for Vanilla JavaScript
// Inspired by Redux but adapted for vanilla JS

class Store {
  constructor(initialState = {}) {
    this.state = initialState;
    this.listeners = [];
    this.middlewares = [];
  }

  getState() {
    return { ...this.state };
  }

  setState(newState) {
    const prevState = this.state;
    this.state = { ...this.state, ...newState };
    this.notifyListeners(prevState, this.state);
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  notifyListeners(prevState, newState) {
    this.listeners.forEach((listener) => listener(newState, prevState));
  }

  dispatch(action) {
    if (typeof action === "function") {
      return action(this.dispatch.bind(this), this.getState.bind(this));
    }

    // Run through middlewares
    let result = action;
    for (const middleware of this.middlewares) {
      result = middleware(this)(result);
    }

    return result;
  }

  use(middleware) {
    this.middlewares.push(middleware);
  }
}

// Create global store
const appStore = new Store({
  user: null,
  posts: [],
  stories: [],
  notifications: [],
  unreadNotificationsCount: 0,
  following: [],
  followers: [],
  blockedUsers: [],
  loading: false,
  error: null,
  feedCursor: null,
  feedHasMore: true,
});

// Action creators
const actions = {
  // User actions
  setUser: (user) => ({ state: { user } }),
  clearUser: () => ({ state: { user: null } }),

  // Posts actions
  setPosts: (posts) => ({ state: { posts } }),
  addPost: (post) => {
    const currentPosts = appStore.getState().posts;
    return { state: { posts: [post, ...currentPosts] } };
  },
  updatePost: (postId, updates) => {
    const currentPosts = appStore.getState().posts;
    const updatedPosts = currentPosts.map((post) =>
      post.id === postId ? { ...post, ...updates } : post
    );
    return { state: { posts: updatedPosts } };
  },
  removePost: (postId) => {
    const currentPosts = appStore.getState().posts;
    const filteredPosts = currentPosts.filter((post) => post.id !== postId);
    return { state: { posts: filteredPosts } };
  },
  appendPosts: (newPosts) => {
    const currentPosts = appStore.getState().posts;
    return { state: { posts: [...currentPosts, ...newPosts] } };
  },

  // Stories actions
  setStories: (stories) => ({ state: { stories } }),
  addStory: (story) => {
    const currentStories = appStore.getState().stories;
    return { state: { stories: [story, ...currentStories] } };
  },
  removeStory: (storyId) => {
    const currentStories = appStore.getState().stories;
    const filteredStories = currentStories.filter(
      (story) => story.id !== storyId
    );
    return { state: { stories: filteredStories } };
  },

  // Notifications actions
  setNotifications: (notifications) => ({ state: { notifications } }),
  addNotification: (notification) => {
    const currentNotifications = appStore.getState().notifications;
    return {
      state: { notifications: [notification, ...currentNotifications] },
    };
  },
  markNotificationAsRead: (notificationId) => {
    const currentNotifications = appStore.getState().notifications;
    const updatedNotifications = currentNotifications.map((notif) =>
      notif.id === notificationId ? { ...notif, is_read: true } : notif
    );
    return { state: { notifications: updatedNotifications } };
  },
  markAllNotificationsAsRead: () => {
    const currentNotifications = appStore.getState().notifications;
    const updatedNotifications = currentNotifications.map((notif) => ({
      ...notif,
      is_read: true,
    }));
    return {
      state: {
        notifications: updatedNotifications,
        unreadNotificationsCount: 0,
      },
    };
  },
  setUnreadNotificationsCount: (count) => ({
    state: { unreadNotificationsCount: count },
  }),
  incrementUnreadNotifications: () => {
    const currentCount = appStore.getState().unreadNotificationsCount;
    return { state: { unreadNotificationsCount: currentCount + 1 } };
  },

  // Following/Followers actions
  setFollowing: (following) => ({ state: { following } }),
  addFollowing: (userId) => {
    const currentFollowing = appStore.getState().following;
    return { state: { following: [...currentFollowing, userId] } };
  },
  removeFollowing: (userId) => {
    const currentFollowing = appStore.getState().following;
    const filteredFollowing = currentFollowing.filter((id) => id !== userId);
    return { state: { following: filteredFollowing } };
  },

  // Blocked users actions
  setBlockedUsers: (blockedUsers) => ({ state: { blockedUsers } }),
  addBlockedUser: (userId) => {
    const currentBlocked = appStore.getState().blockedUsers;
    return { state: { blockedUsers: [...currentBlocked, userId] } };
  },
  removeBlockedUser: (userId) => {
    const currentBlocked = appStore.getState().blockedUsers;
    const filteredBlocked = currentBlocked.filter((id) => id !== userId);
    return { state: { blockedUsers: filteredBlocked } };
  },

  // UI state actions
  setLoading: (loading) => ({ state: { loading } }),
  setError: (error) => ({ state: { error } }),
  clearError: () => ({ state: { error: null } }),

  // Feed pagination actions
  setFeedCursor: (cursor) => ({ state: { feedCursor: cursor } }),
  setFeedHasMore: (hasMore) => ({ state: { feedHasMore: hasMore } }),
};

// Thunk middleware for async actions
const thunkMiddleware = (store) => (action) => {
  if (action.state) {
    store.setState(action.state);
  }
  return action;
};

appStore.use(thunkMiddleware);

// Async action creators
const asyncActions = {
  // Fetch posts with cursor pagination
  fetchPosts: async (cursor = null) => {
    return async (dispatch, getState) => {
      dispatch(actions.setLoading(true));
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
          dispatch(actions.appendPosts(result.data.posts));
        } else {
          dispatch(actions.setPosts(result.data.posts));
        }

        dispatch(actions.setFeedCursor(result.data.next_cursor));
        dispatch(actions.setFeedHasMore(result.data.has_more));
        dispatch(actions.setLoading(false));

        return result.data;
      } catch (error) {
        dispatch(actions.setError(error.message));
        dispatch(actions.setLoading(false));
        throw error;
      }
    };
  },

  // Fetch following posts
  fetchFollowingPosts: async (cursor = null) => {
    return async (dispatch, getState) => {
      dispatch(actions.setLoading(true));
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
          dispatch(actions.appendPosts(result.data.posts));
        } else {
          dispatch(actions.setPosts(result.data.posts));
        }

        dispatch(actions.setFeedCursor(result.data.next_cursor));
        dispatch(actions.setFeedHasMore(result.data.has_more));
        dispatch(actions.setLoading(false));

        return result.data;
      } catch (error) {
        dispatch(actions.setError(error.message));
        dispatch(actions.setLoading(false));
        throw error;
      }
    };
  },

  // Create post
  createPost: async (postData) => {
    return async (dispatch, getState) => {
      dispatch(actions.setLoading(true));
      try {
        const response = await apiRequest("/posts", {
          method: "POST",
          body: JSON.stringify(postData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to create post");
        }

        dispatch(actions.addPost(result.data));
        dispatch(actions.setLoading(false));
        toast.success("Post created successfully!");

        return result.data;
      } catch (error) {
        dispatch(actions.setError(error.message));
        dispatch(actions.setLoading(false));
        toast.error(error.message);
        throw error;
      }
    };
  },

  // Toggle reaction (like/dislike)
  toggleReaction: async (postId, reactionType) => {
    return async (dispatch, getState) => {
      try {
        const posts = getState().posts;
        const post = posts.find((p) => p.id === postId);

        if (!post) return;

        // Optimistic update
        const currentReaction = post.user_reaction;
        let newLikeCount = post.like_count;
        let newDislikeCount = post.dislike_count;
        let newReaction = null;

        if (currentReaction === reactionType) {
          // Remove reaction
          if (reactionType === "like") {
            newLikeCount--;
          } else {
            newDislikeCount--;
          }
          newReaction = null;
        } else {
          // Add or change reaction
          if (currentReaction === "like") {
            newLikeCount--;
          } else if (currentReaction === "dislike") {
            newDislikeCount--;
          }

          if (reactionType === "like") {
            newLikeCount++;
          } else {
            newDislikeCount++;
          }
          newReaction = reactionType;
        }

        dispatch(
          actions.updatePost(postId, {
            user_reaction: newReaction,
            like_count: newLikeCount,
            dislike_count: newDislikeCount,
          })
        );

        // Make API call
        let response;
        if (newReaction === null) {
          response = await apiRequest(`/likes?post_id=${postId}`, {
            method: "DELETE",
          });
        } else {
          response = await apiRequest("/likes", {
            method: "POST",
            body: JSON.stringify({
              post_id: postId,
              reaction_type: reactionType,
            }),
          });
        }

        const result = await response.json();

        if (!response.ok) {
          // Revert on error
          dispatch(
            actions.updatePost(postId, {
              user_reaction: currentReaction,
              like_count: post.like_count,
              dislike_count: post.dislike_count,
            })
          );
          throw new Error(result.error || "Failed to update reaction");
        }
      } catch (error) {
        toast.error(error.message);
        throw error;
      }
    };
  },

  // Fetch notifications
  fetchNotifications: async () => {
    return async (dispatch, getState) => {
      try {
        const response = await apiRequest("/notifications");
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to fetch notifications");
        }

        dispatch(actions.setNotifications(result.data));

        const unreadCount = result.data.filter((n) => !n.is_read).length;
        dispatch(actions.setUnreadNotificationsCount(unreadCount));

        return result.data;
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
        throw error;
      }
    };
  },

  // Block user
  blockUser: async (userId) => {
    return async (dispatch, getState) => {
      try {
        const response = await apiRequest(`/users/${userId}/block`, {
          method: "POST",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to block user");
        }

        dispatch(actions.addBlockedUser(userId));

        // Remove posts from blocked user
        const posts = getState().posts;
        const filteredPosts = posts.filter((post) => post.author_id !== userId);
        dispatch(actions.setPosts(filteredPosts));

        toast.success("User blocked successfully");

        return result.data;
      } catch (error) {
        toast.error(error.message);
        throw error;
      }
    };
  },

  // Unblock user
  unblockUser: async (userId) => {
    return async (dispatch, getState) => {
      try {
        const response = await apiRequest(`/users/${userId}/block`, {
          method: "DELETE",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to unblock user");
        }

        dispatch(actions.removeBlockedUser(userId));
        toast.success("User unblocked successfully");

        return result.data;
      } catch (error) {
        toast.error(error.message);
        throw error;
      }
    };
  },
};

// Helper function to create selector
function createSelector(selectorFn) {
  return () => selectorFn(appStore.getState());
}

// Selectors
const selectors = {
  getUser: createSelector((state) => state.user),
  getPosts: createSelector((state) => state.posts),
  getStories: createSelector((state) => state.stories),
  getNotifications: createSelector((state) => state.notifications),
  getUnreadNotificationsCount: createSelector(
    (state) => state.unreadNotificationsCount
  ),
  getFollowing: createSelector((state) => state.following),
  getBlockedUsers: createSelector((state) => state.blockedUsers),
  isLoading: createSelector((state) => state.loading),
  getError: createSelector((state) => state.error),
  getFeedCursor: createSelector((state) => state.feedCursor),
  getFeedHasMore: createSelector((state) => state.feedHasMore),
};

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = { appStore, actions, asyncActions, selectors };
}
