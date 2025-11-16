// Global variables
let currentUserProfile = null;
let infiniteScroll = null;
let pullToRefresh = null;
let realtimeNotif = null;

document.addEventListener("DOMContentLoaded", async () => {
  // Load theme preference from localStorage
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
  } else if (savedTheme === "light") {
    document.body.classList.remove("dark-mode");
  } else if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    // If no preference, check system preference
    document.body.classList.add("dark-mode");
  }

  // Add Story button handler
  const addStoryBtn = document.querySelector(".add-story-btn");
  if (addStoryBtn) {
    addStoryBtn.addEventListener("click", () => {
      window.location.href = "/create-story.html";
    });
  }

  // Initialize app with all features
  await initializeApp();
});

// Initialize application
async function initializeApp() {
  try {
    // Get current user profile
    currentUserProfile = await getCurrentUserProfile();

    if (!currentUserProfile) {
      window.location.href = "/login.html";
      return;
    }

    // Initialize state management
    if (typeof appStore !== "undefined") {
      appStore.dispatch(actions.setUser(currentUserProfile));

      // Subscribe to state changes
      appStore.subscribe((newState, prevState) => {
        if (newState.posts !== prevState.posts) {
          renderPostsFromStore();
        }
        if (
          newState.unreadNotificationsCount !==
          prevState.unreadNotificationsCount
        ) {
          updateNotificationBadge();
        }
      });
    }

    // Load initial data
    await fetchFollowingStories();
    await fetchFollowingPosts();

    // Initialize enhanced features
    initializeInfiniteScroll();
    initializePullToRefresh();
    await initializeRealtimeNotifications();

    toast.success("Welcome back!");
  } catch (error) {
    console.error("Initialization error:", error);
    toast.error("Failed to load feed");
  }
}

// Get current user's community profile
async function getCurrentUserProfile() {
  try {
    const session = JSON.parse(localStorage.getItem("supabaseSession"));
    if (!session || !session.user || !session.user.id) {
      return null;
    }
    const userId = session.user.id;

    const response = await apiRequest(`/profile/${userId}`);
    if (response.ok) {
      const data = await response.json();
      return data.data || data;
    }
    return null;
  } catch (error) {
    console.error("Error fetching current user profile:", error);
    return null;
  }
}

// Initialize infinite scroll
function initializeInfiniteScroll() {
  if (typeof InfiniteScroll === "undefined") return;

  const postsContainer = document.getElementById("following-posts-container");
  if (!postsContainer) return;

  infiniteScroll = new InfiniteScroll({
    container: postsContainer,
    threshold: 0.8,
    rootMargin: "100px",
    onLoadMore: async () => {
      if (typeof appStore === "undefined") return { hasMore: false };

      const state = appStore.getState();
      if (!state.feedHasMore) return { hasMore: false };

      const cursor = state.feedCursor;
      try {
        const result = await appStore.dispatch(
          asyncActions.fetchFollowingPosts(cursor)
        );
        return { hasMore: result.has_more };
      } catch (error) {
        console.error("Error loading more posts:", error);
        return { hasMore: false };
      }
    },
  });
}

// Initialize pull-to-refresh
function initializePullToRefresh() {
  if (typeof PullToRefresh === "undefined") return;

  const mainContainer = document.querySelector(".container");
  if (!mainContainer) return;

  pullToRefresh = new PullToRefresh({
    container: mainContainer,
    threshold: 80,
    maxPull: 120,
    onRefresh: async () => {
      await refreshFeed();
    },
  });
}

// Initialize real-time notifications
async function initializeRealtimeNotifications() {
  if (typeof initRealtimeNotifications === "undefined") return;

  try {
    const session = JSON.parse(localStorage.getItem("supabaseSession"));
    if (!session || !currentUserProfile) return;

    realtimeNotif = await initRealtimeNotifications(
      supabaseClient,
      session.user.id,
      currentUserProfile.id,
      handleNewNotification
    );
  } catch (error) {
    console.error("Failed to initialize real-time notifications:", error);
  }
}

// Handle new real-time notification
function handleNewNotification(notification) {
  console.log("📬 New notification:", notification);
  updateNotificationBadge();
}

// Refresh feed
async function refreshFeed() {
  try {
    if (infiniteScroll) {
      infiniteScroll.reset();
    }

    await fetchFollowingStories();
    await fetchFollowingPosts();

    toast.success("Feed refreshed!");
  } catch (error) {
    console.error("Error refreshing feed:", error);
    toast.error("Failed to refresh feed");
  }
}

// Update notification badge
function updateNotificationBadge() {
  const badge = document.querySelector(".notification-badge");
  if (!badge) return;

  let count = 0;
  if (typeof appStore !== "undefined") {
    count = appStore.getState().unreadNotificationsCount;
  }

  if (count > 0) {
    badge.textContent = count > 99 ? "99+" : count;
    badge.style.display = "flex";
  } else {
    badge.style.display = "none";
  }
}

function timeAgo(dateString) {
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  } else if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}m ago`;
  } else if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}h ago`;
  } else {
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }
}

// Format content with clickable hashtags
function formatContentWithHashtags(content) {
  if (!content) return "";
  return content.replace(/#(\w+)/g, (match, tag) => {
    return `<a href="/hashtag.html?tag=${tag}" class="hashtag" style="color: #3b82f6; font-weight: 600;">${match}</a>`;
  });
}

function renderStory(story) {
  const storyElement = document.createElement("div");
  storyElement.classList.add("story");
  storyElement.style.cursor = "pointer";
  storyElement.dataset.storyId = story.id;

  storyElement.innerHTML = `
    <div class="story-avatar">
      ${
        story.community_profiles?.avatar_url
          ? `<img src="${story.community_profiles.avatar_url}" alt="Story Author Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`
          : `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>`
      }
    </div>
    <div class="story-label">${
      story.community_profiles?.display_name ||
      story.community_profiles?.username ||
      "Unknown"
    }</div>
  `;

  // Add click handler to view story
  storyElement.addEventListener("click", () => viewStory(story));

  return storyElement;
}

// View story
async function viewStory(story) {
  // Mark story as viewed
  try {
    await apiRequest("/stories/views", {
      method: "POST",
      body: JSON.stringify({ story_id: story.id }),
    });
  } catch (error) {
    console.error("Error marking story as viewed:", error);
  }

  // Show story in modal/overlay
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  `;

  overlay.innerHTML = `
    <div style="max-width: 500px; max-height: 90vh; position: relative;">
      <button onclick="this.closest('div').parentElement.remove()" style="position: absolute; top: 10px; right: 10px; background: white; border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; z-index: 1;">✕</button>
      <img src="${
        story.image_url
      }" alt="Story" style="max-width: 100%; max-height: 90vh; border-radius: 12px;">
      <div style="position: absolute; bottom: 20px; left: 20px; color: white; background: rgba(0,0,0,0.5); padding: 10px; border-radius: 8px;">
        <strong>${
          story.community_profiles?.display_name ||
          story.community_profiles?.username
        }</strong>
        <div style="font-size: 0.9rem; margin-top: 5px;">${timeAgo(
          story.created_at
        )}</div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
}

// Handle like toggle
async function handleLikeToggle(postId, likeBtn, likeCountSpan) {
  try {
    const isLiked = likeBtn.dataset.liked === "true";

    let response;
    if (isLiked) {
      // Unlike
      response = await apiRequest(`/likes?post_id=${postId}`, {
        method: "DELETE",
      });
    } else {
      // Like
      response = await apiRequest("/likes", {
        method: "POST",
        body: JSON.stringify({ post_id: postId }),
      });
    }

    if (response.ok) {
      // Toggle UI
      const currentCount = parseInt(likeCountSpan.textContent) || 0;
      likeCountSpan.textContent = isLiked ? currentCount - 1 : currentCount + 1;
      likeBtn.dataset.liked = !isLiked;
      likeBtn.style.color = isLiked ? "" : "#e74c3c";
    } else {
      const error = await response.json();
      console.error("Failed to toggle like:", error);
    }
  } catch (error) {
    console.error("Error toggling like:", error);
  }
}

// Handle delete post
async function handleDeletePost(postId, postElement) {
  if (!confirm("Are you sure you want to delete this post?")) {
    return;
  }

  try {
    const response = await apiRequest(`/posts/${postId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      postElement.remove();
      alert("Post deleted successfully!");
    } else {
      const error = await response.json();
      alert("Failed to delete post: " + (error.error || "Unknown error"));
    }
  } catch (error) {
    console.error("Error deleting post:", error);
    alert("An error occurred while deleting the post.");
  }
}

// Handle save toggle
async function handleSaveToggle(postId, saveBtn) {
  try {
    const isSaved = saveBtn.dataset.saved === "true";

    let response;
    if (isSaved) {
      // Unsave
      response = await apiRequest(`/saved-posts?post_id=${postId}`, {
        method: "DELETE",
      });
    } else {
      // Save
      response = await apiRequest("/saved-posts", {
        method: "POST",
        body: JSON.stringify({ post_id: postId }),
      });
    }

    if (response.ok) {
      // Toggle UI
      saveBtn.dataset.saved = !isSaved;
      saveBtn.style.color = isSaved ? "" : "#3498db";
      saveBtn.title = isSaved ? "Save post" : "Unsave post";
    } else {
      const error = await response.json();
      console.error("Failed to toggle save:", error);
    }
  } catch (error) {
    console.error("Error toggling save:", error);
  }
}

// Show comments
async function showComments(postId) {
  try {
    const response = await apiRequest(`/comments?post_id=${postId}`);
    if (response.ok) {
      const comments = await response.json();

      let commentsHtml =
        '<div class="comments-section" style="margin-top: 1rem; padding: 1rem; border-top: 1px solid #ddd;">';
      commentsHtml += '<h4 style="margin-bottom: 0.5rem;">Comments</h4>';

      if (comments && comments.length > 0) {
        comments.forEach((comment) => {
          const authorName =
            comment.community_profiles?.display_name ||
            comment.community_profiles?.username ||
            "Unknown";
          const isOwnComment =
            currentUserProfile && comment.author_id === currentUserProfile.id;

          commentsHtml += `
            <div class="comment-item" style="margin-bottom: 0.75rem; padding: 0.5rem; background: rgba(0,0,0,0.02); border-radius: 8px; position: relative;">
              <div style="font-weight: 600; margin-bottom: 0.25rem;">${authorName}</div>
              <div style="font-size: 0.9rem;">${comment.content}</div>
              <div style="font-size: 0.75rem; color: #666; margin-top: 0.25rem;">${timeAgo(
                comment.created_at
              )}</div>
              ${
                isOwnComment
                  ? `<button onclick="deleteComment('${comment.id}', '${postId}')" style="position: absolute; top: 0.5rem; right: 0.5rem; background: none; border: none; color: #e74c3c; cursor: pointer; font-size: 0.9rem;">Delete</button>`
                  : ""
              }
            </div>
          `;
        });
      } else {
        commentsHtml +=
          '<p style="color: #666;">No comments yet. Be the first to comment!</p>';
      }

      commentsHtml += `
        <div class="add-comment" style="margin-top: 1rem;">
          <textarea id="comment-input-${postId}" placeholder="Write a comment..." style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 8px; resize: vertical; min-height: 60px;"></textarea>
          <button onclick="postComment('${postId}')" class="btn btn-primary" style="margin-top: 0.5rem;">Post Comment</button>
          <button onclick="closeComments('${postId}')" class="btn btn-secondary" style="margin-top: 0.5rem; margin-left: 0.5rem;">Close</button>
        </div>
      `;
      commentsHtml += "</div>";

      return commentsHtml;
    }
  } catch (error) {
    console.error("Error fetching comments:", error);
    return '<div style="color: red;">Failed to load comments</div>';
  }
}

// Make these functions global so they can be called from inline onclick
function createBasicPostElement(post) {
  const postElement = document.createElement("div");
  postElement.classList.add("post-card");
  postElement.dataset.postId = post.id;

  const authorDisplayName =
    post.community_profiles?.display_name ||
    post.community_profiles?.username ||
    "Unknown";
  const authorAvatarUrl = post.community_profiles?.avatar_url || "";
  const isOwnPost =
    currentUserProfile && post.author_id === currentUserProfile.id;

  postElement.innerHTML = `
    <div class="post-header">
      <div class="post-header-left">
        <div class="post-avatar">
          ${
            authorAvatarUrl
              ? `<img src="${authorAvatarUrl}" alt="Author Avatar">`
              : `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>`
          }
        </div>
        <div class="post-header-info">
          <div class="post-author">
            <span class="post-author-name">${authorDisplayName}</span>
          </div>
          <div class="post-timestamp">${timeAgo(post.created_at)}</div>
        </div>
      </div>
      ${
        isOwnPost
          ? `<button class="post-menu-btn" data-action="more">⋮</button>`
          : ""
      }
    </div>
    <div class="post-content">
      <p class="post-text">${post.content}</p>
      ${
        post.image_url
          ? `<img src="${post.image_url}" alt="Post" class="post-image">`
          : ""
      }
    </div>
    <div class="post-stats">
      <div class="post-stat" data-stat="likes"><span class="stat-label">${
        post.likes_count || 0
      }</span> Likes</div>
      <div class="post-stat" data-stat="dislikes"><span class="stat-label">${
        post.dislikes_count || 0
      }</span> Dislikes</div>
      <div class="post-stat" data-stat="comments"><span class="stat-label">${
        post.comments_count || 0
      }</span> Comments</div>
    </div>
    <div class="post-actions">
      <button class="post-action-btn" data-action="like">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
        </svg>
        <span class="action-text">Like</span>
      </button>
      <button class="post-action-btn" data-action="dislike">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l4.501 1.5M10 14l1.5-3m0 0l1.5 3m-1.5-3v6m0 0l3.5 1.5" />
        </svg>
        <span class="action-text">Dislike</span>
      </button>
      <button class="post-action-btn" data-action="comment">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.003 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span class="action-text">Comment</span>
      </button>
      <button class="post-action-btn" data-action="save">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        <span class="action-text">Save</span>
      </button>
      <button class="post-action-btn" data-action="share">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C9.589 12.938 10 12.052 10 11V5a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h.5m13.5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2" />
        </svg>
        <span class="action-text">Share</span>
      </button>
      ${
        isOwnPost
          ? `<button class="post-action-btn" data-action="more">⋮</button>`
          : ""
      }
    </div>
  `;

  return postElement;
}

window.handleAddComment = async function (postId) {
  const textarea = document.getElementById(`comment-input-${postId}`);
  const content = textarea.value.trim();

  if (!content) {
    toast.warning("Comment cannot be empty");
    return;
  }

  try {
    const response = await apiRequest("/comments", {
      method: "POST",
      body: JSON.stringify({
        post_id: postId,
        content: content,
      }),
    });

    if (response.ok) {
      // Update post comment count in store
      if (typeof appStore !== "undefined") {
        const state = appStore.getState();
        const post = state.posts.find((p) => p.id === postId);
        if (post) {
          appStore.dispatch(
            actions.updatePost(postId, {
              comments_count: (post.comments_count || 0) + 1,
            })
          );
        }
      }

      // Reload comments
      await showComments(postId);
      toast.success("Comment posted!");
    } else {
      const error = await response.json();
      console.error("Failed to add comment:", error);
      toast.error("Failed to post comment");
    }
  } catch (error) {
    console.error("Error adding comment:", error);
    toast.error("An error occurred");
  }
};

window.deleteComment = async function (commentId, postId) {
  if (!confirm("Are you sure you want to delete this comment?")) {
    return;
  }

  try {
    const response = await apiRequest(`/comments?comment_id=${commentId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      alert("Comment deleted!");
      fetchFollowingPosts();
    } else {
      const error = await response.json();
      alert("Failed to delete comment: " + (error.error || "Unknown error"));
    }
  } catch (error) {
    console.error("Error deleting comment:", error);
    alert("An error occurred while deleting the comment.");
  }
};

window.closeComments = function (postId) {
  const commentsSection = document.querySelector(
    `[data-post-id="${postId}"] .comments-section`
  );
  if (commentsSection) {
    commentsSection.remove();
  }
};

async function renderPost(post) {
  // Use PostCardRenderer if available, otherwise fallback to basic render
  if (typeof PostCardRenderer !== "undefined") {
    const renderer = new PostCardRenderer();
    const postHTML = renderer.renderPost(post, currentUserProfile);

    const postElement = document.createElement("div");
    postElement.innerHTML = postHTML;
    const postCard = postElement.querySelector(".post-card");

    // Wire up event listeners
    wirePostCardEventListeners(postCard, post);

    return postCard;
  } else {
    // Fallback to basic rendering if PostCardRenderer not loaded
    console.warn("PostCardRenderer not found, using basic rendering");
    return createBasicPostElement(post);
  }
}

function wirePostCardEventListeners(postCard, post) {
  const isOwnPost =
    currentUserProfile && post.author_id === currentUserProfile.id;

  // Like button
  const likeBtn = postCard.querySelector(
    '.post-action-btn[data-action="like"]'
  );
  if (likeBtn) {
    likeBtn.addEventListener("click", async () => {
      await handleReaction(post.id, "like", likeBtn, postCard);
    });
  }

  // Dislike button
  const dislikeBtn = postCard.querySelector(
    '.post-action-btn[data-action="dislike"]'
  );
  if (dislikeBtn) {
    dislikeBtn.addEventListener("click", async () => {
      await handleReaction(post.id, "dislike", dislikeBtn, postCard);
    });
  }

  // Comment button
  const commentBtn = postCard.querySelector(
    '.post-action-btn[data-action="comment"]'
  );
  if (commentBtn) {
    commentBtn.addEventListener("click", async () => {
      toggleComments(postCard, post);
    });
  }

  // Save button
  const saveBtn = postCard.querySelector(
    '.post-action-btn[data-action="save"]'
  );
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      await handleSaveToggle(post.id, saveBtn);
    });
  }

  // Share button
  const shareBtn = postCard.querySelector(
    '.post-action-btn[data-action="share"]'
  );
  if (shareBtn) {
    shareBtn.addEventListener("click", () => {
      if (typeof handleSharePost === "function") {
        handleSharePost(post.id, post.content);
      }
    });
  }

  // More menu
  const moreBtn = postCard.querySelector(
    '.post-action-btn[data-action="more"]'
  );
  if (moreBtn && isOwnPost) {
    moreBtn.addEventListener("click", () => {
      showPostMenu(postCard, post);
    });
  }
}

async function handleReaction(postId, reactionType, button, postCard) {
  try {
    const isActive = button.classList.contains("active");

    if (isActive) {
      // Remove reaction
      const response = await apiRequest(`/likes?post_id=${postId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        button.classList.remove("active");
        updateReactionCount(postCard, reactionType, -1);
      }
    } else {
      // Add reaction
      const response = await apiRequest("/likes", {
        method: "POST",
        body: JSON.stringify({
          post_id: postId,
          reaction_type: reactionType,
        }),
      });

      if (response.ok) {
        button.classList.add("active");
        updateReactionCount(postCard, reactionType, 1);

        // Remove opposite reaction if active
        const oppositeType = reactionType === "like" ? "dislike" : "like";
        const oppositeBtn = postCard.querySelector(
          `.post-action-btn[data-action="${oppositeType}"]`
        );
        if (oppositeBtn && oppositeBtn.classList.contains("active")) {
          oppositeBtn.classList.remove("active");
          updateReactionCount(postCard, oppositeType, -1);
        }
      }
    }
  } catch (error) {
    console.error("Error handling reaction:", error);
    toast.error("Failed to update reaction");
  }
}

function updateReactionCount(postCard, reactionType, delta) {
  const statLabel = postCard.querySelector(
    `.post-stat[data-stat="${reactionType}s"] .stat-label`
  );
  if (statLabel) {
    const currentCount = parseInt(statLabel.textContent) || 0;
    statLabel.textContent = Math.max(0, currentCount + delta);
  }
}

async function toggleComments(postCard, post) {
  let commentSection = postCard.querySelector(".post-comment-section");

  if (commentSection) {
    commentSection.remove();
    return;
  }

  // Create comment section
  commentSection = document.createElement("div");
  commentSection.className = "post-comment-section";

  try {
    // Fetch comments
    const response = await apiRequest(`/comments?post_id=${post.id}`);
    const comments = await response.json();

    let html = '<div class="comment-input-wrapper">';
    html += `<input type="text" class="comment-input" placeholder="Add a comment..." data-post-id="${post.id}" />`;
    html += '<button class="comment-submit-btn">Post</button>';
    html += "</div>";

    if (comments && comments.length > 0) {
      html += '<div class="comments-list">';
      comments.forEach((comment) => {
        const renderer = new PostCardRenderer();
        html += renderer.renderComment(comment);
      });
      html += "</div>";
    } else {
      html +=
        '<p style="color: var(--text-tertiary, #999); text-align: center; padding: 1rem;">No comments yet</p>';
    }

    commentSection.innerHTML = html;

    // Wire up submit button
    const submitBtn = commentSection.querySelector(".comment-submit-btn");
    const input = commentSection.querySelector(".comment-input");

    submitBtn.addEventListener("click", async () => {
      const content = input.value.trim();
      if (!content) {
        toast.warning("Comment cannot be empty");
        return;
      }

      await postComment(post.id, content, postCard);
      input.value = "";
      // Reload comments
      toggleComments(postCard, post);
    });

    postCard.appendChild(commentSection);
  } catch (error) {
    console.error("Error loading comments:", error);
    commentSection.innerHTML =
      '<p style="color: red;">Failed to load comments</p>';
    postCard.appendChild(commentSection);
  }
}

async function postComment(postId, content, postCard) {
  try {
    const response = await apiRequest("/comments", {
      method: "POST",
      body: JSON.stringify({ post_id: postId, content }),
    });

    if (response.ok) {
      toast.success("Comment posted!");
      // Update comments count
      const stat = postCard.querySelector(
        '.post-stat[data-stat="comments"] .stat-label'
      );
      if (stat) {
        stat.textContent = parseInt(stat.textContent) + 1;
      }
    } else {
      toast.error("Failed to post comment");
    }
  } catch (error) {
    console.error("Error posting comment:", error);
    toast.error("An error occurred");
  }
}

function showPostMenu(postCard, post) {
  const isOwnPost =
    currentUserProfile && post.author_id === currentUserProfile.id;

  if (!isOwnPost) return;

  if (confirm("Delete this post?")) {
    handleDeletePost(post.id, postCard.closest(".post-card"));
  }
}

async function fetchFollowingStories() {
  const storiesContainer = document.getElementById(
    "following-stories-container"
  );
  storiesContainer.innerHTML = "<p>Loading stories...</p>"; // Add loading message

  try {
    const response = await apiRequest("/stories/following");
    const stories = await response.json();

    if (response.ok) {
      storiesContainer.innerHTML = ""; // Clear loading message

      if (stories && stories.length > 0) {
        stories.forEach((story) => {
          storiesContainer.appendChild(renderStory(story));
        });
      } else {
        storiesContainer.innerHTML = "<p>No stories from followed users.</p>";
      }
    } else {
      console.error("Failed to fetch following stories:", stories.error);
      storiesContainer.innerHTML = `<p>Error loading stories: ${stories.error}</p>`; // Display error message
      // Redirect to login if unauthorized
      if (response.status === 401) {
        window.location.href = "login.html";
      }
    }
  } catch (error) {
    console.error("Error fetching following stories:", error);
    storiesContainer.innerHTML = "<p>Error loading stories.</p>"; // Display generic error message
  }
}

// Fetch following posts
async function fetchFollowingPosts() {
  const postsContainer = document.getElementById("following-posts-container");
  postsContainer.innerHTML = "<p>Loading posts...</p>"; // Add loading message

  try {
    // Get current user profile first
    await getCurrentUserProfile();

    const response = await apiRequest("/posts/following");
    const posts = await response.json();

    if (response.ok) {
      postsContainer.innerHTML = ""; // Clear loading message

      if (posts && posts.length > 0) {
        for (const post of posts) {
          const postElement = await renderPost(post);
          postsContainer.appendChild(postElement);
        }
      } else {
        postsContainer.innerHTML = "<p>No posts from followed users.</p>";
      }
    } else {
      console.error("Failed to fetch following posts:", posts.error);
      postsContainer.innerHTML = `<p>Error loading posts: ${posts.error}</p>`; // Display error message
      // Redirect to login if unauthorized
      if (response.status === 401) {
        window.location.href = "login.html";
      }
    }
  } catch (error) {
    console.error("Error fetching following posts:", error);
    postsContainer.innerHTML = "<p>Error loading posts.</p>"; // Display generic error message
  }
}
