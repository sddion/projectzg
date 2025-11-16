# Redux + Zod Refactoring Guide

## Overview

This document outlines the refactoring of the ProjectZG application to use Redux (Redux Toolkit-like) state management and Zod for form validation, making the codebase more maintainable and scalable.

## What's New

### 1. **Zod Validation Schemas** (`public/js/validators.js`)

All form validations are now centralized using Zod-like schemas:

```javascript
// Usage example in signup.js
const validation = SignupSchema.validate({
  display_name: 'John Doe',
  username: 'johndoe',
  email: 'john@example.com',
  password: 'SecurePass123'
});

if (!validation.valid) {
  console.log(validation.errors); // { username: 'Username is required' }
}
```

**Available Schemas:**
- `SignupSchema` - Signup form validation
- `LoginSchema` - Login form validation
- `ChangePasswordSchema` - Password change validation
- `EditProfileSchema` - Profile editing validation
- `PostSchema` - Post creation/editing validation
- `CommentSchema` - Comment validation
- `StorySchema` - Story creation validation
- `SearchSchema` - Search query validation

### 2. **Redux Store** (`public/js/store/index.js`)

Simplified Redux-like store for state management:

```javascript
// Dispatch actions
appStore.dispatch(actions.auth.setUser(userData));
appStore.dispatch(actions.posts.addPost(newPost));

// Subscribe to changes
appStore.subscribe((newState) => {
  console.log('State changed:', newState);
});

// Use selectors
const user = selectUser();
const posts = selectPosts();
const unreadCount = selectUnreadCount();
```

### 3. **Store Slices** (`public/js/store/slices/`)

Organized state management with slices:

- **authSlice.js** - User authentication state
- **postsSlice.js** - Posts and pagination state
- **notificationsSlice.js** - Notifications state

Each slice contains:
- `initialState` - Default state values
- `reducers` - Pure functions to update state
- Thunks for async operations

### 4. **Utility Helpers** (`public/js/utils/helpers.js`)

Common utility functions:

```javascript
// Form management
getFormValues(formId);           // Get form data as object
setFormValues(formId, values);   // Set form data
clearForm(formId);               // Reset form
setFormDisabled(formId, true);   // Disable all inputs

// API requests
await apiRequest(endpoint, options);  // Enhanced API wrapper

// DOM manipulation
toggleElement(selector, show);    // Show/hide element
toggleClass(selector, className, add); // Add/remove class
clearElement(selector);           // Clear content

// Data formatting
timeAgo(date);                    // "2h ago"
formatDate(date);                 // "Nov 16, 2025"
formatNumber(1000);               // "1K"

// Debounce/Throttle
debounce(fn, 300);               // Debounce function
throttle(fn, 300);               // Throttle function

// Validation
isValidEmail(email);              // Email validation
isValidUrl(url);                  // URL validation
```

## File Structure

```
public/js/
├── validators.js               # All validation schemas
├── store/
│   ├── index.js               # Main store and selectors
│   └── slices/
│       ├── authSlice.js       # Auth state management
│       ├── postsSlice.js      # Posts state management
│       └── notificationsSlice.js  # Notifications state
├── utils/
│   └── helpers.js             # Utility functions
├── signup.js                  # Refactored signup (uses validators)
├── login.js                   # Refactored login (uses validators)
└── ...other files
```

## Usage Examples

### Form Validation

```javascript
// In signup.js
function validateSignupForm() {
  const formData = {
    display_name: displayNameInput.value.trim(),
    username: usernameInput.value.trim(),
    email: emailInput.value.trim(),
    password: passwordInput.value,
    confirm_password: confirmPasswordInput.value,
  };

  const validation = SignupSchema.validate(formData);
  
  if (!validation.valid) {
    displayErrors(validation.errors);
    return;
  }

  // Form is valid, proceed with submission
}
```

### State Management

```javascript
// Getting state
const state = appStore.getState();
const user = selectUser();
const posts = selectPosts();

// Updating state
appStore.dispatch(actions.auth.setUser(newUser));
appStore.dispatch(actions.posts.addPost(newPost));

// Async operations
appStore.dispatch(postsThunks.fetchPosts()).then(() => {
  console.log('Posts loaded');
});
```

### API Requests

```javascript
// Simple request
const response = await apiRequest('/posts');
const data = await response.json();

// POST request
const response = await apiRequest('/posts', {
  method: 'POST',
  body: JSON.stringify(postData),
});

// With error handling
try {
  const response = await apiRequest('/endpoint');
  if (!response.ok) {
    const error = await handleApiError(response);
    console.error(error.message);
  }
} catch (error) {
  console.error('Request failed:', error);
}
```

### Retry Logic

```javascript
// Retry failed requests with exponential backoff
await retryWithBackoff(
  () => apiRequest('/posts'),
  {
    maxRetries: 3,
    delay: 1000,
    backoffMultiplier: 2
  }
);
```

## Migration Guide

### For Existing Code

1. **Replace inline validation with schemas:**
   ```javascript
   // OLD
   if (!email || !password) {
     alert('Please fill in all fields');
     return;
   }

   // NEW
   const validation = LoginSchema.validate(formData);
   if (!validation.valid) {
     displayErrors(validation.errors);
     return;
   }
   ```

2. **Use store for state management:**
   ```javascript
   // OLD
   let currentUser = null;
   let posts = [];

   // NEW
   appStore.dispatch(actions.auth.setUser(userData));
   appStore.dispatch(actions.posts.setPosts(postsData));
   ```

3. **Use selectors to get state:**
   ```javascript
   // OLD
   const user = currentUserProfile;

   // NEW
   const user = selectUser();
   ```

4. **Use helper functions:**
   ```javascript
   // OLD
   document.getElementById('form').style.display = 'none';

   // NEW
   toggleElement('#form', false);
   ```

## Key Benefits

1. **Maintainability** - Centralized validation and state management
2. **Reusability** - Shared validators and utilities across the app
3. **Testability** - Pure functions are easier to test
4. **Scalability** - Easy to add new features and slices
5. **Error Handling** - Consistent error handling patterns
6. **Performance** - Optimized re-renders with selectors
7. **Developer Experience** - Clear structure and naming conventions

## Next Steps

1. **Update remaining pages** to use new validation schemas:
   - `changepassword.js`
   - `editprofile.js`
   - `createpost.js`
   - `create-story.js`
   - `search.js`

2. **Implement Redux DevTools** for better debugging


## Package Dependencies

The refactored code uses these dependencies (already added to package.json):

- `@reduxjs/toolkit` - Redux state management
- `redux` - Core Redux
- `zod` - Schema validation
- `nanoid` - ID generation

Install dependencies:
```bash
npm install
```

## Support

For issues or questions about the refactoring, refer to:
- Individual file comments and JSDoc
- This guide's examples
- Redux documentation: https://redux.js.org/
- Zod documentation: https://zod.dev/
