# Backend API Documentation

This document provides a comprehensive overview of the ProjectZG backend API structure and response formats.

## API Overview

- **Base URL:** `https://projectzgapi.vercel.app/api`
- **Frontend Origin:** `https://projectzg.vercel.app`
- **Authentication:** Bearer token (JWT from Supabase)
- **Content-Type:** `application/json`

## Response Format

### Success Response

All successful API responses follow a consistent format:

```javascript
// For single object responses (e.g., user creation)
{
  "id": "uuid",
  "field1": "value1",
  "field2": "value2",
  // ... other fields
}

// For array responses (e.g., list of posts)
[
  { "id": "uuid", "field1": "value1" },
  { "id": "uuid", "field1": "value1" }
]

// For operation messages
{
  "message": "Operation description"
}
```

**HTTP Status Codes:**
- `200` - Success (GET, DELETE completed)
- `201` - Created (POST created resource)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `500` - Server Error

### Error Response

All error responses follow this format:

```javascript
{
  "error": "Human-readable error message"
}
```

**Common Error Messages:**
- `"Unauthorized"` - No/invalid Authorization header
- `"Invalid token"` - JWT token is malformed
- `"Username is already taken"` - Username exists
- `"Profile already exists"` - User already has profile
- `"Community profile not found"` - User has no profile
- Database error messages from Supabase

## Endpoints

### Authentication

#### POST `/auth/signup`
Create a new user account.

**Request:**
```javascript
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "display_name": "John Doe"
}
```

**Response (201):**
```javascript
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "user_metadata": {
      "display_name": "John Doe"
    }
  }
}
```

**Errors:**
- `"Signup failed"` - General failure (e.g., email exists)
- Email format validation errors from Supabase
- Password complexity requirements from Supabase

**Frontend Toast Message:**
```javascript
if (response.ok) {
  toast.success('Account created! Please check your email to verify.');
  // Redirect to login after 2 seconds
} else {
  const { error } = await response.json();
  toast.error(`Signup failed: ${error}`);
}
```

---

#### POST `/auth/signin`
Sign in with email and password.

**Request:**
```javascript
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```javascript
{
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    }
  }
}
```

**Errors:**
- `"Invalid login credentials"` - Wrong email/password
- `"Login failed"` - General failure

**Frontend Toast Message:**
```javascript
if (response.ok) {
  toast.success('Login successful! Welcome back.');
} else {
  const { error } = await response.json();
  toast.error(`Login failed: ${error}`);
}
```

---

#### POST `/auth/signout`
Sign out current user.

**Request:** (No body, requires Authorization header)

**Response (200):**
```javascript
{
  "message": "User signed out successfully"
}
```

**Frontend Toast Message:**
```javascript
toast.success('Logged out successfully.');
```

---

#### POST `/auth/reset-password`
Request password reset email.

**Request:**
```javascript
{
  "email": "user@example.com"
}
```

**Response (200):**
```javascript
{
  "message": "Password reset email sent"
}
```

**Frontend Toast Message:**
```javascript
toast.success('Password reset email sent. Check your inbox.');
```

---

### Profile

#### POST `/profile/create`
Create user's community profile (required after signup).

**Request:** (Requires Authorization header)
```javascript
{
  "username": "johndoe",
  "display_name": "John Doe",
  "bio": "Optional bio text",
  "avatar_url": "https://example.com/avatar.jpg",
  "gender": "male" | "female" | "other" | null
}
```

**Response (201):**
```javascript
{
  "id": "uuid",
  "user_id": "uuid",
  "username": "johndoe",
  "display_name": "John Doe",
  "bio": "Optional bio text",
  "avatar_url": "https://example.com/avatar.jpg",
  "gender": "male",
  "posts_count": 0,
  "followers_count": 0,
  "following_count": 0,
  "created_at": "2024-11-16T10:00:00Z"
}
```

**Validations:**
- Username: 3-20 characters, alphanumeric + underscore only
- Username uniqueness check
- Display name: 2-100 characters

**Errors:**
- `"Username and display name are required"`
- `"Username can only contain letters, numbers, and underscores"`
- `"Username must be between 3 and 20 characters"`
- `"Username is already taken"`
- `"Profile already exists"`

**Frontend Toast Message:**
```javascript
if (response.ok) {
  toast.success('Profile created! Welcome to ProjectZG! 🎉');
  // Redirect to home after 1-2 seconds
} else {
  const { error } = await response.json();
  toast.error(`Profile creation failed: ${error}`);
}
```

---

#### GET `/profile/[id]`
Get user's profile by user ID or community profile ID.

**Request:** (Requires Authorization header)

**Response (200):**
```javascript
{
  "id": "uuid",
  "user_id": "uuid",
  "username": "johndoe",
  "display_name": "John Doe",
  "bio": "Bio text",
  "avatar_url": "https://example.com/avatar.jpg",
  "gender": "male",
  "posts_count": 42,
  "followers_count": 150,
  "following_count": 85,
  "created_at": "2024-11-16T10:00:00Z"
}
```

---

### Posts

#### GET `/posts`
Get all posts with author information.

**Response (200):**
```javascript
[
  {
    "id": "uuid",
    "author_id": "uuid",
    "content": "Post content",
    "image_url": "https://example.com/image.jpg",
    "likes_count": 5,
    "comments_count": 2,
    "created_at": "2024-11-16T10:00:00Z",
    "community_profiles": {
      "display_name": "John Doe",
      "username": "johndoe",
      "avatar_url": "https://example.com/avatar.jpg"
    }
  }
]
```

---

#### POST `/posts`
Create a new post.

**Request:** (Requires Authorization header)
```javascript
{
  "content": "This is my post content",
  "image_url": "https://example.com/image.jpg" // Optional
}
```

**Response (201):**
```javascript
{
  "id": "uuid",
  "author_id": "uuid",
  "content": "This is my post content",
  "image_url": "https://example.com/image.jpg",
  "likes_count": 0,
  "comments_count": 0,
  "created_at": "2024-11-16T10:00:00Z"
}
```

**Validations:**
- Content: 1-5000 characters, required
- Image URL: valid URL format, optional

**Frontend Toast Message:**
```javascript
if (response.ok) {
  toast.success('Post created! 🎉');
} else {
  const { error } = await response.json();
  toast.error(`Failed to create post: ${error}`);
}
```

---

#### GET `/posts/[id]`
Get single post by ID.

**Response (200):** Same as GET `/posts` item

---

#### DELETE `/posts/[id]`
Delete a post (only owner can delete).

**Request:** (Requires Authorization header)

**Response (200):**
```javascript
{
  "message": "Post deleted successfully"
}
```

**Errors:**
- `"You can only delete your own posts"`
- `"Post not found"`

**Frontend Toast Message:**
```javascript
if (response.ok) {
  toast.success('Post deleted successfully.');
} else {
  const { error } = await response.json();
  toast.error(`Failed to delete post: ${error}`);
}
```

---

#### GET `/posts/following`
Get posts from followed users.

**Request:** (Requires Authorization header)

**Response (200):** Array of posts (same format as GET `/posts`)

---

### Comments

#### POST `/comments`
Create a comment on a post.

**Request:** (Requires Authorization header)
```javascript
{
  "post_id": "uuid",
  "content": "This is my comment"
}
```

**Response (201):**
```javascript
{
  "id": "uuid",
  "post_id": "uuid",
  "author_id": "uuid",
  "content": "This is my comment",
  "likes_count": 0,
  "created_at": "2024-11-16T10:00:00Z"
}
```

**Validations:**
- Content: 1-1000 characters, required

**Frontend Toast Message:**
```javascript
if (response.ok) {
  toast.success('Comment posted!');
} else {
  const { error } = await response.json();
  toast.error(`Failed to post comment: ${error}`);
}
```

---

#### GET `/comments?post_id={id}`
Get all comments for a post.

**Response (200):**
```javascript
[
  {
    "id": "uuid",
    "post_id": "uuid",
    "author_id": "uuid",
    "content": "Comment content",
    "likes_count": 0,
    "created_at": "2024-11-16T10:00:00Z",
    "community_profiles": {
      "display_name": "John Doe",
      "username": "johndoe",
      "avatar_url": "https://example.com/avatar.jpg"
    }
  }
]
```

---

#### DELETE `/comments?comment_id={id}`
Delete a comment (only owner can delete).

**Request:** (Requires Authorization header)

**Response (200):**
```javascript
{
  "message": "Comment deleted successfully"
}
```

**Frontend Toast Message:**
```javascript
if (response.ok) {
  toast.success('Comment deleted.');
} else {
  toast.error('Failed to delete comment.');
}
```

---

### Likes

#### POST `/likes`
Like a post.

**Request:** (Requires Authorization header)
```javascript
{
  "post_id": "uuid"
}
```

**Response (201):**
```javascript
{
  "id": "uuid",
  "post_id": "uuid",
  "user_id": "uuid",
  "created_at": "2024-11-16T10:00:00Z"
}
```

**Frontend Toast Message:** (Usually silent, maybe show on batch operations)
```javascript
// Show toast only if liking fails
if (!response.ok) {
  toast.error('Failed to like post');
}
```

---

#### DELETE `/likes?post_id={id}`
Unlike a post.

**Request:** (Requires Authorization header)

**Response (200):**
```javascript
{
  "message": "Post unliked successfully"
}
```

---

### Stories

#### POST `/stories`
Create a new story.

**Request:** (Requires Authorization header)
```javascript
{
  "image_url": "https://example.com/story.jpg",
  "text": "Optional story text"
}
```

**Response (201):**
```javascript
{
  "id": "uuid",
  "author_id": "uuid",
  "image_url": "https://example.com/story.jpg",
  "text": "Optional story text",
  "created_at": "2024-11-16T10:00:00Z",
  "expires_at": "2024-11-17T10:00:00Z"
}
```

**Frontend Toast Message:**
```javascript
if (response.ok) {
  toast.success('Story posted! 🎉');
} else {
  toast.error('Failed to create story');
}
```

---

#### GET `/stories/following`
Get stories from followed users.

**Request:** (Requires Authorization header)

**Response (200):** Array of stories with expiration dates

---

#### POST `/stories/views`
Mark story as viewed.

**Request:** (Requires Authorization header)
```javascript
{
  "story_id": "uuid"
}
```

**Response (201):**
```javascript
{
  "id": "uuid",
  "story_id": "uuid",
  "user_id": "uuid",
  "created_at": "2024-11-16T10:00:00Z"
}
```

---

### Follows

#### POST `/follows`
Follow a user.

**Request:** (Requires Authorization header)
```javascript
{
  "following_id": "uuid" // UUID of user to follow
}
```

**Response (201):**
```javascript
{
  "id": "uuid",
  "follower_id": "uuid",
  "following_id": "uuid",
  "created_at": "2024-11-16T10:00:00Z"
}
```

**Frontend Toast Message:**
```javascript
if (response.ok) {
  toast.success('Following user!');
} else {
  toast.error('Failed to follow user');
}
```

---

#### DELETE `/follows?following_id={id}`
Unfollow a user.

**Request:** (Requires Authorization header)

**Response (200):**
```javascript
{
  "message": "User unfollowed successfully"
}
```

---

### Notifications

#### GET `/notifications`
Get all notifications for current user.

**Request:** (Requires Authorization header)

**Response (200):**
```javascript
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "type": "like" | "comment" | "follow",
    "actor_id": "uuid",
    "post_id": "uuid",
    "read": false,
    "created_at": "2024-11-16T10:00:00Z",
    "actor": {
      "username": "johndoe",
      "avatar_url": "https://example.com/avatar.jpg"
    }
  }
]
```

---

#### PUT `/notifications/[id]`
Mark notification as read.

**Request:** (Requires Authorization header)
```javascript
{
  "read": true
}
```

**Response (200):**
```javascript
{
  "message": "Notification marked as read"
}
```

---

### Saved Posts

#### POST `/saved-posts`
Save a post for later.

**Request:** (Requires Authorization header)
```javascript
{
  "post_id": "uuid"
}
```

**Response (201):**
```javascript
{
  "id": "uuid",
  "user_id": "uuid",
  "post_id": "uuid",
  "created_at": "2024-11-16T10:00:00Z"
}
```

---

#### GET `/saved-posts`
Get all saved posts.

**Request:** (Requires Authorization header)

**Response (200):** Array of posts

---

#### DELETE `/saved-posts?post_id={id}`
Unsave a post.

**Request:** (Requires Authorization header)

**Response (200):**
```javascript
{
  "message": "Post removed from saved"
}
```

---

### Search

#### GET `/search?q={query}`
Search for users and posts.

**Response (200):**
```javascript
[
  {
    "id": "uuid",
    "type": "user" | "post",
    "username": "johndoe",
    "display_name": "John Doe",
    "avatar_url": "https://example.com/avatar.jpg",
    // ... other fields depending on type
  }
]
```

---

## Common Patterns

### Authentication Header

```javascript
const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(data)
});
```

### Error Handling Pattern

```javascript
try {
  const response = await apiRequest('/endpoint', options);
  
  if (!response.ok) {
    const { error } = await response.json();
    toast.error(`Operation failed: ${error}`);
    return;
  }
  
  const data = await response.json();
  toast.success('Operation successful!');
  return data;
} catch (error) {
  toast.error('Network error. Please try again.');
  console.error('Critical error:', error); // Only for debugging
}
```

### Authorization Check

```javascript
if (auth.error) {
  return createErrorResponse(auth.error, 401);
}
```

This means the JWT token is invalid or missing.

---

## Database Schema Relations

### User Relationship Flow

```
1. User signs up via /auth/signup
   ↓ Supabase creates auth.users entry
   ↓ Trigger creates public.users entry
   ↓
2. User must create community profile via /profile/create
   ↓ Creates community_profiles entry
   ↓
3. Now user can: create posts, follow others, comment, like
```

### Data Relationships

```
community_profiles
  ├── user_id (→ users)
  ├── username (UNIQUE)
  └── display_name

posts
  ├── author_id (→ community_profiles)
  ├── content
  └── image_url

comments
  ├── post_id (→ posts)
  ├── author_id (→ community_profiles)
  └── content

post_likes
  ├── post_id (→ posts)
  └── user_id (→ community_profiles)

stories
  ├── author_id (→ community_profiles)
  └── expires_at (24 hours after created_at)

follows
  ├── follower_id (→ community_profiles)
  └── following_id (→ community_profiles)

notifications
  ├── user_id (→ community_profiles)
  └── actor_id (→ community_profiles)

saved_posts
  ├── user_id (→ community_profiles)
  └── post_id (→ posts)
```

---

## Frontend Implementation Best Practices

### 1. Always Check Response Status

```javascript
if (!response.ok) {
  const { error } = await response.json();
  toast.error(error);
  return;
}
```

### 2. Use Toast for User Feedback

```javascript
// Success
toast.success('Action completed successfully');

// Error
toast.error('Error message from backend');

// Info (for loading states, important messages)
toast.info('Processing your request...');

// Warning (for destructive actions)
toast.warning('This action cannot be undone');
```

### 3. Handle Network Errors

```javascript
catch (error) {
  toast.error('Network error. Please try again.');
  console.error('Critical error for debugging:', error);
}
```

### 4. Show Loading State

```javascript
const loadingToast = toast.loading('Creating post...');
// ... API call
loadingToast.update('Post created!', 'success');
```

### 5. Graceful Error Messages

```javascript
// Bad: Show raw error
toast.error(error.message); // User sees: "TypeError: Cannot read property..."

// Good: Show user-friendly message
toast.error('Failed to create post. Please try again.');
if (isDebugMode) {
  console.error('Debug:', error);
}
```

---

## API Version History

- **v1.0** (Current) - Launch version with all basic endpoints
- Future: Real-time events, advanced search, media processing

---

## Troubleshooting

### 401 Unauthorized
- JWT token is missing or invalid
- User session has expired
- Solution: Redirect to login page, request new session

### 400 Bad Request
- Validation error (check validation rules in API docs above)
- Missing required fields
- Solution: Show user-friendly error message from `error` field

### 500 Server Error
- Database error
- Server crash
- Solution: Show generic message, contact admin

---

**Last Updated:** November 16, 2025
**API Base URL:** https://projectzgapi.vercel.app/api
**Frontend:** https://projectzg.vercel.app
