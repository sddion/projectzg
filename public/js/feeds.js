document.addEventListener("DOMContentLoaded", () => {
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

  let currentUserProfile = null;

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
        currentUserProfile = data;
        return data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching current user profile:", error);
      return null;
    }
  }

  // Wire up post card event listeners
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
      toast?.error?.("Failed to update reaction") ||
        alert("Failed to update reaction");
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
          toast?.warning?.("Comment cannot be empty") ||
            alert("Comment cannot be empty");
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
        toast?.success?.("Comment posted!") || alert("Comment posted!");
        // Update comments count
        const stat = postCard.querySelector(
          '.post-stat[data-stat="comments"] .stat-label'
        );
        if (stat) {
          stat.textContent = parseInt(stat.textContent) + 1;
        }
      } else {
        toast?.error?.("Failed to post comment") ||
          alert("Failed to post comment");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      toast?.error?.("An error occurred") || alert("An error occurred");
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
        toast?.success?.("Post deleted successfully!") ||
          alert("Post deleted successfully!");
      } else {
        const error = await response.json();
        toast?.error?.(
          "Failed to delete post: " + (error.error || "Unknown error")
        ) ||
          alert("Failed to delete post: " + (error.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast?.error?.("An error occurred while deleting the post.") ||
        alert("An error occurred while deleting the post.");
    }
  }

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

  async function renderPost(post) {
    // Use PostCardRenderer if available
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
      // Fallback to basic rendering
      console.warn("PostCardRenderer not found, using basic rendering");
      return createBasicPostElement(post);
    }
  }

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

  async function fetchAllPosts() {
    const postsContainer = document.getElementById("all-posts-container");
    postsContainer.innerHTML = "<p>Loading posts...</p>"; // Add loading message

    try {
      // Get current user profile first
      await getCurrentUserProfile();

      const response = await apiRequest("/posts");
      const posts = await response.json();

      if (response.ok) {
        postsContainer.innerHTML = ""; // Clear loading message

        if (posts && posts.length > 0) {
          for (const post of posts) {
            const postElement = await renderPost(post);
            postsContainer.appendChild(postElement);
          }
        } else {
          postsContainer.innerHTML = "<p>No posts to display.</p>";
        }
      } else {
        console.error("Failed to fetch posts:", posts.error);
        postsContainer.innerHTML = `<p>Error loading posts: ${posts.error}</p>`; // Display error message
        if (response.status === 401) {
          window.location.href = "login.html";
        }
      }
    } catch (error) {
      console.error("Error fetching all posts:", error);
      postsContainer.innerHTML = "<p>Error loading posts.</p>"; // Display generic error message
    }
  }

  // Fetch all posts when the page loads
  fetchAllPosts();
});
