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

  let currentUserProfile = null;
  let viewingUserProfile = null;

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

  async function fetchUserProfile() {
    const session = JSON.parse(localStorage.getItem("supabaseSession"));
    const userId = session ? session.user.id : null;

    if (!userId) {
      console.error("No user ID found. Please sign in.");
      window.location.href = "login.html";
      return;
    }

    try {
      const response = await apiRequest(`/profile/${userId}`);

      if (response.ok) {
        const profile = await response.json();
        viewingUserProfile = profile;

        document.getElementById("profile-header-username").textContent =
          profile.display_name || "Profile";
        document.getElementById("profile-display-name").textContent =
          profile.display_name || "";
        document.getElementById("profile-handle").textContent =
          `@${profile.username}` || "";
        document.getElementById("profile-bio").textContent = profile.bio || "";
        document.getElementById("profile-posts-count").textContent =
          profile.posts_count || "0";
        document.getElementById("profile-followers-count").textContent =
          profile.followers_count || "0";
        document.getElementById("profile-following-count").textContent =
          profile.following_count || "0";

        // Handle avatar display
        const profileAvatar = document.querySelector(".profile-avatar");
        if (profile.avatar_url) {
          profileAvatar.innerHTML = `<img src="${profile.avatar_url}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
          profileAvatar.innerHTML = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 48px; height: 48px">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>`;
        }
      } else if (response.status === 404) {
        console.warn("Profile not found for user. Prompting to create one.");
        document.getElementById("profile-header-username").textContent =
          "Profile Not Found";
        document.getElementById("profile-display-name").textContent =
          "Welcome! Please complete your profile.";
        document.getElementById("profile-bio").textContent =
          'Click the "Edit Profile" button to get started.';
      } else {
        const errorInfo = await response
          .json()
          .catch(() => ({ error: "Failed to parse error response" }));
        console.error(
          "Failed to fetch profile:",
          errorInfo.error || response.statusText
        );
        document.getElementById("profile-header-username").textContent =
          "Error";
        document.getElementById("profile-display-name").textContent =
          "Failed to load profile.";
        if (response.status === 401) {
          window.location.href = "login.html";
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      document.getElementById("profile-header-username").textContent = "Error";
      document.getElementById("profile-display-name").textContent =
        "Failed to load profile.";
    }
  }

  async function handleLikeToggle(postId, likeBtn, likeCountSpan) {
    try {
      const isLiked = likeBtn.dataset.liked === "true";

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

      if (response.ok) {
        const currentCount = parseInt(likeCountSpan.textContent) || 0;
        likeCountSpan.textContent = isLiked
          ? currentCount - 1
          : currentCount + 1;
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
        // Reload profile to update counts
        fetchUserProfile();
      } else {
        const error = await response.json();
        alert("Failed to delete post: " + (error.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("An error occurred while deleting the post.");
    }
  }

  async function handleSaveToggle(postId, saveBtn) {
    try {
      const isSaved = saveBtn.dataset.saved === "true";

      let response;
      if (isSaved) {
        response = await apiRequest(`/saved-posts?post_id=${postId}`, {
          method: "DELETE",
        });
      } else {
        response = await apiRequest("/saved-posts", {
          method: "POST",
          body: JSON.stringify({ post_id: postId }),
        });
      }

      if (response.ok) {
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

  window.postComment = async function (postId) {
    const textarea = document.getElementById(`comment-input-${postId}`);
    const content = textarea.value.trim();

    if (!content) {
      alert("Please enter a comment");
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
        alert("Comment posted!");
        fetchUserPosts();
      } else {
        const error = await response.json();
        alert("Failed to post comment: " + (error.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      alert("An error occurred while posting the comment.");
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
        fetchUserPosts();
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

  function renderPostAsGridItem(post) {
    const gridItem = document.createElement("div");
    gridItem.classList.add("grid-item");
    gridItem.style.cursor = "pointer";
    gridItem.dataset.postId = post.id;

    if (post.image_url) {
      gridItem.innerHTML = `<img src="${post.image_url}" alt="Post Image" style="width: 100%; height: 100%; object-fit: cover;">`;
    } else {
      gridItem.innerHTML = `<div style="padding: 1rem; overflow: hidden; text-overflow: ellipsis;">${post.content.substring(
        0,
        100
      )}${post.content.length > 100 ? "..." : ""}</div>`;
    }

    // Click to view post details
    gridItem.addEventListener("click", () => showPostDetails(post));

    return gridItem;
  }

  function showPostDetails(post) {
    const modal = document.createElement("div");
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      overflow-y: auto;
    `;

    const authorDisplayName =
      post.community_profiles?.display_name ||
      post.community_profiles?.username ||
      "Unknown";
    const authorAvatarUrl = post.community_profiles?.avatar_url || "";
    const isOwnPost =
      currentUserProfile && post.author_id === currentUserProfile.id;

    modal.innerHTML = `
      <div style="background: white; max-width: 600px; width: 90%; border-radius: 12px; max-height: 90vh; overflow-y: auto; position: relative;">
        <button onclick="this.closest('div').parentElement.remove()" style="position: absolute; top: 10px; right: 10px; background: white; border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; z-index: 1; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">✕</button>

        <div style="padding: 1.5rem;">
          <div class="post-header" style="display: flex; align-items: center; margin-bottom: 1rem;">
            <div style="width: 48px; height: 48px; border-radius: 50%; overflow: hidden; margin-right: 0.75rem;">
              ${
                authorAvatarUrl
                  ? `<img src="${authorAvatarUrl}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;">`
                  : `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 100%; height: 100%;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>`
              }
            </div>
            <div>
              <div style="font-weight: 600;">${authorDisplayName}</div>
              <div style="font-size: 0.875rem; color: #666;">${timeAgo(
                post.created_at
              )}</div>
            </div>
          </div>

          ${
            post.image_url
              ? `<img src="${post.image_url}" alt="Post Image" style="width: 100%; border-radius: 8px; margin-bottom: 1rem;">`
              : ""
          }

          <div style="margin-bottom: 1rem; line-height: 1.6;">${
            post.content
          }</div>

          <div style="display: flex; gap: 1.5rem; padding: 1rem 0; border-top: 1px solid #eee; border-bottom: 1px solid #eee;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 24px; height: 24px;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
              <span>${post.likes_count || 0} likes</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 24px; height: 24px;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.003 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>${post.comments_count || 0} comments</span>
            </div>
          </div>

          ${
            isOwnPost
              ? `<button onclick="deletePostFromModal('${post.id}')" style="width: 100%; padding: 0.75rem; margin-top: 1rem; background: #e74c3c; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">Delete Post</button>`
              : ""
          }
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  window.deletePostFromModal = async function (postId) {
    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      const response = await apiRequest(`/posts/${postId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Post deleted successfully!");
        document
          .querySelectorAll('[style*="z-index: 9999"]')
          .forEach((el) => el.remove());
        fetchUserProfile();
        fetchUserPosts();
      } else {
        const error = await response.json();
        alert("Failed to delete post: " + (error.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("An error occurred while deleting the post.");
    }
  };

  async function fetchUserPosts() {
    const profileGrid = document.querySelector(".profile-grid");
    profileGrid.innerHTML = "<p>Loading posts...</p>";

    // Get current user profile first
    await getCurrentUserProfile();

    if (!viewingUserProfile || !viewingUserProfile.id) {
      profileGrid.innerHTML = "<p>Please load profile first.</p>";
      return;
    }

    try {
      // Fetch all posts and filter by author_id matching community profile id
      const response = await apiRequest("/posts");
      const allPosts = await response.json();

      if (response.ok) {
        profileGrid.innerHTML = "";

        // Filter posts by author_id matching the viewing user's community profile id
        const userPosts = allPosts.filter(
          (post) => post.author_id === viewingUserProfile.id
        );

        if (userPosts && userPosts.length > 0) {
          userPosts.forEach((post) => {
            const gridItem = renderPostAsGridItem(post);
            profileGrid.appendChild(gridItem);
          });
        } else {
          profileGrid.innerHTML = "<p>No posts yet.</p>";
        }
      } else {
        console.error("Failed to fetch posts:", allPosts.error);
        profileGrid.innerHTML = `<p>Error loading posts: ${allPosts.error}</p>`;
        if (response.status === 401) {
          window.location.href = "login.html";
        }
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      profileGrid.innerHTML = "<p>Error loading posts.</p>";
    }
  }

  // Fetch profile data and posts when the page loads
  await fetchUserProfile();
  await fetchUserPosts();
});
