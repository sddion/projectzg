// Simple Redux-like Store Implementation


class SimpleReduxStore {
  constructor(initialState = {}) {
    this.state = initialState;
    this.listeners = [];
    this.thunks = {};
    this.slices = {};
  }

  // Get current state
  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  // Subscribe to state changes
  subscribe(listener) {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Dispatch actions
  dispatch(action) {
    if (typeof action === 'function') {
      // Handle thunk
      return action(this.dispatch.bind(this), this.getState.bind(this));
    }

    if (typeof action === 'object' && action.type) {
      // Handle regular action
      const [sliceName, actionName] = action.type.split('/');
      
      if (this.slices[sliceName] && this.slices[sliceName].reducers[actionName]) {
        const reducer = this.slices[sliceName].reducers[actionName];
        const sliceState = this.state[sliceName] || this.slices[sliceName].initialState;
        
        const newSliceState = reducer(sliceState, action);
        this.state = {
          ...this.state,
          [sliceName]: newSliceState,
        };

        this.notifyListeners();
      }
    }

    return action;
  }

  // Register a slice
  registerSlice(slice) {
    this.slices[slice.name] = slice;
    this.state[slice.name] = slice.initialState;
  }

  // Notify all listeners of state change
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.getState()));
  }

  // Create selector
  createSelector(selectorFn) {
    return () => selectorFn(this.getState());
  }

  // Get slice state
  getSliceState(sliceName) {
    return this.state[sliceName];
  }
}

// Create global store
const appStore = new SimpleReduxStore();

// Register slices
try {
  if (typeof AuthSlice !== 'undefined') {
    appStore.registerSlice(AuthSlice);
  }
  if (typeof PostsSlice !== 'undefined') {
    appStore.registerSlice(PostsSlice);
  }
  if (typeof NotificationsSlice !== 'undefined') {
    appStore.registerSlice(NotificationsSlice);
  }
} catch (e) {
  console.warn('Some slices not yet loaded:', e.message);
}

// ============ Selector Creators ============

const createSelector = (selectorFn) => {
  return () => selectorFn(appStore.getState());
};

// Auth selectors
const selectAuth = createSelector(state => state.auth || {});
const selectUser = createSelector(state => state.auth?.user || null);
const selectIsAuthenticated = createSelector(state => state.auth?.isAuthenticated || false);
const selectAuthLoading = createSelector(state => state.auth?.loading || false);
const selectAuthError = createSelector(state => state.auth?.error || null);

// Posts selectors
const selectPosts = createSelector(state => state.posts?.items || []);
const selectPostsLoading = createSelector(state => state.posts?.loading || false);
const selectPostsError = createSelector(state => state.posts?.error || null);
const selectPostsCursor = createSelector(state => state.posts?.cursor || null);
const selectPostsHasMore = createSelector(state => state.posts?.hasMore || true);
const selectCurrentPost = createSelector(state => state.posts?.currentPost || null);

// Notifications selectors
const selectNotifications = createSelector(state => state.notifications?.items || []);
const selectUnreadCount = createSelector(state => state.notifications?.unreadCount || 0);
const selectNotificationsLoading = createSelector(state => state.notifications?.loading || false);
const selectNotificationsError = createSelector(state => state.notifications?.error || null);

// Derived selectors
const selectHasUnreadNotifications = createSelector(
  state => (state.notifications?.unreadCount || 0) > 0
);

// ============ Actions ============

const actions = {
  // Auth actions
  auth: {
    setUser: (user) => ({ type: 'auth/setUser', payload: user }),
    clearUser: () => ({ type: 'auth/clearUser' }),
    setLoading: (loading) => ({ type: 'auth/setLoading', payload: loading }),
    setError: (error) => ({ type: 'auth/setError', payload: error }),
    clearError: () => ({ type: 'auth/clearError' }),
    setSession: (session) => ({ type: 'auth/setSession', payload: session }),
  },

  // Posts actions
  posts: {
    setPosts: (posts) => ({ type: 'posts/setPosts', payload: posts }),
    appendPosts: (posts) => ({ type: 'posts/appendPosts', payload: posts }),
    addPost: (post) => ({ type: 'posts/addPost', payload: post }),
    updatePost: (postId, updates) => ({
      type: 'posts/updatePost',
      payload: { id: postId, updates },
    }),
    removePost: (postId) => ({ type: 'posts/removePost', payload: postId }),
    setCurrentPost: (post) => ({ type: 'posts/setCurrentPost', payload: post }),
    clearCurrentPost: () => ({ type: 'posts/clearCurrentPost' }),
    setCursor: (cursor) => ({ type: 'posts/setCursor', payload: cursor }),
    setHasMore: (hasMore) => ({ type: 'posts/setHasMore', payload: hasMore }),
    setLoading: (loading) => ({ type: 'posts/setLoading', payload: loading }),
    setError: (error) => ({ type: 'posts/setError', payload: error }),
    updateCommentCount: (postId, delta) => ({
      type: 'posts/updateCommentCount',
      payload: { postId, delta },
    }),
    updateLikeCount: (postId, delta) => ({
      type: 'posts/updateLikeCount',
      payload: { postId, delta },
    }),
  },

  // Notifications actions
  notifications: {
    setNotifications: (notifications) => ({
      type: 'notifications/setNotifications',
      payload: notifications,
    }),
    addNotification: (notification) => ({
      type: 'notifications/addNotification',
      payload: notification,
    }),
    markAsRead: (notificationId) => ({
      type: 'notifications/markAsRead',
      payload: notificationId,
    }),
    markAllAsRead: () => ({ type: 'notifications/markAllAsRead' }),
    setUnreadCount: (count) => ({
      type: 'notifications/setUnreadCount',
      payload: count,
    }),
    removeNotification: (notificationId) => ({
      type: 'notifications/removeNotification',
      payload: notificationId,
    }),
    clearNotifications: () => ({ type: 'notifications/clearNotifications' }),
  },
};

// ============ Export ============

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SimpleReduxStore,
    appStore,
    createSelector,
    actions,
    // Selectors
    selectAuth,
    selectUser,
    selectIsAuthenticated,
    selectAuthLoading,
    selectAuthError,
    selectPosts,
    selectPostsLoading,
    selectPostsError,
    selectPostsCursor,
    selectPostsHasMore,
    selectCurrentPost,
    selectNotifications,
    selectUnreadCount,
    selectNotificationsLoading,
    selectNotificationsError,
    selectHasUnreadNotifications,
  };
}
