// ============================================================================
// REACTION SYSTEM (Like/Dislike)
// ============================================================================

/**
 * Handle post reaction (like/dislike)
 * @param {string} postId - Post UUID
 * @param {string} reactionType - 'like' or 'dislike'
 */
async function handleReaction(postId, reactionType) {
  try {
    // Use store if available for optimistic updates
    if (typeof appStore !== "undefined") {
      await appStore.dispatch(
        asyncActions.toggleReaction(postId, reactionType)
      );
      return;
    }

    // Fallback to direct API call
    const response = await apiRequest("/likes", {
      method: "POST",
      body: JSON.stringify({
        post_id: postId,
        reaction_type: reactionType,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      if (typeof toast !== "undefined") {
        toast.success(reactionType === "like" ? "👍 Liked!" : "👎 Disliked!");
      }
      // Refresh posts to show updated counts
      if (typeof fetchFollowingPosts !== "undefined") {
        await fetchFollowingPosts();
      }
    } else {
      if (typeof toast !== "undefined") {
        toast.error(result.error || "Failed to update reaction");
      }
    }
  } catch (error) {
    console.error("Error handling reaction:", error);
    if (typeof toast !== "undefined") {
      toast.error("Failed to update reaction");
    }
  }
}

/**
 * Remove reaction from post
 * @param {string} postId - Post UUID
 */
async function removeReaction(postId) {
  try {
    const response = await apiRequest(`/likes?post_id=${postId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      if (typeof toast !== "undefined") {
        toast.info("Reaction removed");
      }
      if (typeof fetchFollowingPosts !== "undefined") {
        await fetchFollowingPosts();
      }
    } else {
      const result = await response.json();
      if (typeof toast !== "undefined") {
        toast.error(result.error || "Failed to remove reaction");
      }
    }
  } catch (error) {
    console.error("Error removing reaction:", error);
    if (typeof toast !== "undefined") {
      toast.error("Failed to remove reaction");
    }
  }
}

// ============================================================================
// BLOCKING SYSTEM
// ============================================================================

/**
 * Block a user
 * @param {string} userId - User UUID to block
 */
async function blockUser(userId) {
  if (
    !confirm(
      "Block this user? They will no longer see your content and you won't see theirs."
    )
  ) {
    return;
  }

  try {
    // Use store if available
    if (
      typeof appStore !== "undefined" &&
      typeof asyncActions !== "undefined"
    ) {
      await appStore.dispatch(asyncActions.blockUser(userId));
      return;
    }

    // Fallback to direct API call
    const response = await apiRequest(`/users/${userId}/block`, {
      method: "POST",
    });

    const result = await response.json();

    if (response.ok) {
      if (typeof toast !== "undefined") {
        toast.success("User blocked successfully");
      }
      // Refresh feed to remove blocked user's content
      if (typeof fetchFollowingPosts !== "undefined") {
        await fetchFollowingPosts();
      }
    } else {
      if (typeof toast !== "undefined") {
        toast.error(result.error || "Failed to block user");
      }
    }
  } catch (error) {
    console.error("Error blocking user:", error);
    if (typeof toast !== "undefined") {
      toast.error("Failed to block user");
    }
  }
}

/**
 * Unblock a user
 * @param {string} userId - User UUID to unblock
 */
async function unblockUser(userId) {
  if (!confirm("Unblock this user?")) {
    return;
  }

  try {
    // Use store if available
    if (
      typeof appStore !== "undefined" &&
      typeof asyncActions !== "undefined"
    ) {
      await appStore.dispatch(asyncActions.unblockUser(userId));
      return;
    }

    // Fallback to direct API call
    const response = await apiRequest(`/users/${userId}/block`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (response.ok) {
      if (typeof toast !== "undefined") {
        toast.success("User unblocked successfully");
      }
    } else {
      if (typeof toast !== "undefined") {
        toast.error(result.error || "Failed to unblock user");
      }
    }
  } catch (error) {
    console.error("Error unblocking user:", error);
    if (typeof toast !== "undefined") {
      toast.error("Failed to unblock user");
    }
  }
}

// ============================================================================
// REPORTING SYSTEM
// ============================================================================

/**
 * Report content (post, comment, user, story)
 * @param {string} itemId - UUID of item to report
 * @param {string} itemType - 'post', 'comment', 'user', or 'story'
 */
async function reportContent(itemId, itemType) {
  const reasons = {
    1: { value: "spam", label: "Spam" },
    2: { value: "harassment", label: "Harassment" },
    3: { value: "inappropriate", label: "Inappropriate content" },
    4: { value: "misinformation", label: "Misinformation" },
    5: { value: "other", label: "Other" },
  };

  const reasonNumber = prompt(
    "Why are you reporting this content?\n\n" +
      "1. Spam\n" +
      "2. Harassment\n" +
      "3. Inappropriate content\n" +
      "4. Misinformation\n" +
      "5. Other\n\n" +
      "Enter number (1-5):"
  );

  if (!reasonNumber || !reasons[reasonNumber]) {
    if (typeof toast !== "undefined") {
      toast.warning("Report cancelled");
    }
    return;
  }

  const reason = reasons[reasonNumber].value;
  let description = null;

  if (reason === "other") {
    description = prompt("Please describe the issue:");
    if (!description || description.trim() === "") {
      if (typeof toast !== "undefined") {
        toast.warning("Report cancelled - description required");
      }
      return;
    }
  }

  try {
    const response = await apiRequest("/reports", {
      method: "POST",
      body: JSON.stringify({
        reported_item_id: itemId,
        reported_item_type: itemType,
        reason: reason,
        description: description,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      if (typeof toast !== "undefined") {
        toast.success(
          "Report submitted. Thank you for keeping our community safe! 🛡️"
        );
      } else {
        alert("Report submitted. Thank you!");
      }
    } else {
      if (typeof toast !== "undefined") {
        toast.error(result.error || "Failed to submit report");
      } else {
        alert(result.error || "Failed to submit report");
      }
    }
  } catch (error) {
    console.error("Error submitting report:", error);
    if (typeof toast !== "undefined") {
      toast.error("Failed to submit report");
    } else {
      alert("Failed to submit report");
    }
  }
}

// ============================================================================
// SHARING SYSTEM
// ============================================================================

/**
 * Share post to other platforms or copy link
 * @param {string} postId - Post UUID
 * @param {string} authorUsername - Post author username (optional)
 */
async function sharePost(postId, authorUsername) {
  authorUsername = authorUsername || "";
  const shareUrl = `${window.location.origin}/post.html?id=${postId}`;
  const shareText = authorUsername
    ? `Check out this post by @${authorUsername} on ProjectZG!`
    : "Check out this post on ProjectZG!";

  // Check if Web Share API is available (mobile)
  if (navigator.share) {
    try {
      await navigator.share({
        title: "ProjectZG Post",
        text: shareText,
        url: shareUrl,
      });
      if (typeof toast !== "undefined") {
        toast.success("Post shared successfully! 📤");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error sharing:", error);
        fallbackShare(shareUrl, shareText);
      }
    }
  } else {
    fallbackShare(shareUrl, shareText);
  }
}

/**
 * Share user profile
 * @param {string} userId - User UUID
 * @param {string} username - Username
 */
async function shareProfile(userId, username) {
  const shareUrl = `${window.location.origin}/profile.html?id=${userId}`;
  const shareText = `Check out @${username}'s profile on ProjectZG!`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: `${username} on ProjectZG`,
        text: shareText,
        url: shareUrl,
      });
      if (typeof toast !== "undefined") {
        toast.success("Profile shared successfully! 📤");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error sharing:", error);
        fallbackShare(shareUrl, shareText);
      }
    }
  } else {
    fallbackShare(shareUrl, shareText);
  }
}

/**
 * Fallback share method - shows modal with share options
 * @param {string} url - URL to share
 * @param {string} text - Text to share
 */
function fallbackShare(url, text) {
  // Show modal with share options
  const modal = document.createElement("div");
  modal.className = "share-modal-overlay";
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  modal.innerHTML = `
    <div class="share-modal" style="
      background: white;
      border-radius: 16px;
      padding: 2rem;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
    ">
      <h3 style="margin: 0 0 1.5rem 0; font-size: 1.25rem;">Share</h3>

      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <!-- Copy Link -->
        <button onclick="copyToClipboard('${url}')" style="
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: #f3f4f6;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        " onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='#f3f4f6'">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
          </svg>
          Copy Link
        </button>

        <!-- WhatsApp -->
        <a href="https://wa.me/?text=${encodedText}%20${encodedUrl}" target="_blank" style="
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: #25D366;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-size: 14px;
          transition: opacity 0.2s;
        " onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
           WhatsApp
        </a>

        <!-- Twitter -->
        <a href="https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}" target="_blank" style="
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: #1DA1F2;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-size: 14px;
          transition: opacity 0.2s;
        " onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
          Twitter
        </a>

        <!-- Facebook -->
        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}" target="_blank" style="
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: #1877F2;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-size: 14px;
          transition: opacity 0.2s;
        " onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
           Facebook
        </a>

        <!-- Cancel -->
        <button onclick="this.closest('.share-modal-overlay').remove()" style="
          padding: 12px 16px;
          background: transparent;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          color: #6b7280;
          transition: background 0.2s;
        " onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='transparent'">
          Cancel
        </button>
      </div>
    </div>
  `;

  modal.onclick = function (e) {
    if (e.target === modal) {
      modal.remove();
    }
  };

  document.body.appendChild(modal);
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 */
function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(function () {
      if (typeof toast !== "undefined") {
        toast.success("Link copied to clipboard! 📋");
      } else {
        alert("Link copied!");
      }
      // Close the share modal
      const modal = document.querySelector(".share-modal-overlay");
      if (modal) {
        modal.remove();
      }
    })
    .catch(function (err) {
      console.error("Failed to copy:", err);
      if (typeof toast !== "undefined") {
        toast.error("Failed to copy link");
      } else {
        alert("Failed to copy link");
      }
    });
}

// ============================================================================
// POST MENU SYSTEM
// ============================================================================

/**
 * Open post menu with options
 * @param {string} postId - Post UUID
 * @param {string} authorId - Post author UUID
 * @param {string} authorUsername - Post author username
 */
function openPostMenu(postId, authorId, authorUsername) {
  authorUsername = authorUsername || "";
  const isOwnPost = currentUserProfile && authorId === currentUserProfile.id;

  const modal = document.createElement("div");
  modal.className = "post-menu-overlay";
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    z-index: 9999;
    animation: fadeIn 0.2s;
  `;

  const menuHtml = `
    <div class="post-menu" style="
      background: white;
      width: 100%;
      max-width: 500px;
      border-radius: 16px 16px 0 0;
      padding: 1rem 0;
      animation: slideUp 0.3s;
    ">
      ${
        isOwnPost
          ? `
        <button onclick="handleDeletePost('${postId}'); closePostMenu();" style="
          width: 100%;
          padding: 1rem;
          border: none;
          background: transparent;
          cursor: pointer;
          text-align: left;
          font-size: 16px;
          color: #ef4444;
          transition: background 0.2s;
        " onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='transparent'">
           Delete Post
        </button>
      `
          : `
        <button onclick="blockUser('${authorId}'); closePostMenu();" style="
          width: 100%;
          padding: 1rem;
          border: none;
          background: transparent;
          cursor: pointer;
          text-align: left;
          font-size: 16px;
          transition: background 0.2s;
        " onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='transparent'">
           Block User
        </button>
        <button onclick="reportContent('${postId}', 'post'); closePostMenu();" style="
          width: 100%;
          padding: 1rem;
          border: none;
          background: transparent;
          cursor: pointer;
          text-align: left;
          font-size: 16px;
          color: #ef4444;
          transition: background 0.2s;
        " onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='transparent'">
          ⚠️ Report Post
        </button>
      `
      }
      <button onclick="sharePost('${postId}', '${authorUsername}'); closePostMenu();" style="
        width: 100%;
        padding: 1rem;
        border: none;
        background: transparent;
        cursor: pointer;
        text-align: left;
        font-size: 16px;
        transition: background 0.2s;
      " onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='transparent'">
         Share
      </button>
      <button onclick="copyToClipboard('${
        window.location.origin
      }/post.html?id=${postId}'); closePostMenu();" style="
        width: 100%;
        padding: 1rem;
        border: none;
        background: transparent;
        cursor: pointer;
        text-align: left;
        font-size: 16px;
        transition: background 0.2s;
      " onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='transparent'">
         Copy Link
      </button>
      <button onclick="closePostMenu()" style="
        width: 100%;
        padding: 1rem;
        border: none;
        background: transparent;
        cursor: pointer;
        text-align: left;
        font-size: 16px;
        color: #6b7280;
        transition: background 0.2s;
      " onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='transparent'">
        Cancel
      </button>
    </div>
  `;

  modal.innerHTML = menuHtml;

  modal.onclick = function (e) {
    if (e.target === modal) {
      closePostMenu();
    }
  };

  document.body.appendChild(modal);
}

/**
 * Close post menu
 */
function closePostMenu() {
  const menu = document.querySelector(".post-menu-overlay");
  if (menu) {
    menu.style.animation = "fadeOut 0.2s";
    setTimeout(function () {
      menu.remove();
    }, 200);
  }
}

// ============================================================================
// DELETE POST (if not already defined in home.js)
// ============================================================================

/**
 * Delete a post
 * @param {string} postId - Post UUID
 */
if (typeof handleDeletePost === "undefined") {
  window.handleDeletePost = async function (postId) {
    if (!confirm("Delete this post? This cannot be undone.")) {
      return;
    }

    try {
      const response = await apiRequest(`/posts/${postId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok) {
        // Remove from store if available
        if (typeof appStore !== "undefined") {
          appStore.dispatch(actions.removePost(postId));
        } else {
          // Remove from DOM
          const postElement = document.querySelector(
            `[data-post-id="${postId}"]`
          );
          if (postElement) {
            postElement.remove();
          }
        }
        if (typeof toast !== "undefined") {
          toast.success("Post deleted successfully! 🗑️");
        } else {
          alert("Post deleted successfully!");
        }
      } else {
        if (typeof toast !== "undefined") {
          toast.error(result.error || "Failed to delete post");
        } else {
          alert(result.error || "Failed to delete post");
        }
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      if (typeof toast !== "undefined") {
        toast.error("Failed to delete post");
      } else {
        alert("Failed to delete post");
      }
    }
  };
}

// Make functions globally available
window.handleReaction = handleReaction;
window.removeReaction = removeReaction;
window.blockUser = blockUser;
window.unblockUser = unblockUser;
window.reportContent = reportContent;
window.sharePost = sharePost;
window.shareProfile = shareProfile;
window.copyToClipboard = copyToClipboard;
window.openPostMenu = openPostMenu;
window.closePostMenu = closePostMenu;
