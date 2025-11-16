/**
 * Enhanced Post Card Renderer
 * Renders complete post cards with all interactive features
 * like/dislike, save, comments, share, reactions, etc.
 */

class PostCardRenderer {
  constructor(options = {}) {
    this.currentUserProfile = options.currentUserProfile || null;
    this.onLike = options.onLike || (() => {});
    this.onDislike = options.onDislike || (() => {});
    this.onSave = options.onSave || (() => {});
    this.onComment = options.onComment || (() => {});
    this.onShare = options.onShare || (() => {});
    this.onDelete = options.onDelete || (() => {});
    this.onReply = options.onReply || (() => {});
  }

  /**
   * Render a complete post card with all features
   */
  renderPost(post) {
    const isOwnPost = this.currentUserProfile?.id === post.author_id;
    const userReaction = post.user_reaction || null; // 'like', 'dislike', or null
    const isSaved = post.is_saved || false;

    const mentionedUsers = this.extractMentions(post.content);
    const hashtags = this.extractHashtags(post.content);
    const contentHtml = this.enrichContent(post.content);

    const postHTML = `
      <div class="post-card" data-post-id="${post.id}">
        <!-- Post Header -->
        <div class="post-header">
          <div class="post-header-left">
            <img 
              data-lazy-src="${
                post.community_profiles?.avatar_url ||
                "/image/default-avatar.png"
              }"
              alt="${post.community_profiles?.display_name || "User"}"
              class="post-avatar"
            />
            <div class="post-header-info">
              <div class="post-author">
                <a href="/profile.html?user=${
                  post.author_id
                }" class="post-author-name">
                  ${post.community_profiles?.display_name || "Anonymous"}
                </a>
                <span class="post-username">@${
                  post.community_profiles?.username || "user"
                }</span>
              </div>
              <div class="post-timestamp">${this.formatTime(
                post.created_at
              )}</div>
            </div>
          </div>
          ${
            isOwnPost
              ? `
            <div class="post-menu">
              <button class="post-menu-btn" onclick="openPostMenu('${post.id}', '${post.author_id}', '${post.community_profiles?.username}')">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2m0 7a1 1 0 110-2 1 1 0 010 2m0 7a1 1 0 110-2 1 1 0 010 2" />
                </svg>
              </button>
            </div>
          `
              : ""
          }
        </div>

        <!-- Post Content -->
        <div class="post-content">
          <div class="post-text">${contentHtml}</div>
          ${
            post.image_url
              ? `
            <img 
              data-lazy-src="${post.image_url}"
              data-low-quality-src="${post.image_url}?w=300"
              alt="Post image"
              class="post-image"
            />
          `
              : ""
          }
        </div>

        ${
          mentionedUsers.length > 0
            ? `
          <div class="post-mentions">
            <strong>Mentioned:</strong>
            ${mentionedUsers
              .map((user) => `<span class="mention-tag">@${user}</span>`)
              .join("")}
          </div>
        `
            : ""
        }

        ${
          hashtags.length > 0
            ? `
          <div class="post-hashtags">
            ${hashtags
              .map(
                (tag) =>
                  `<a href="/search.html?q=%23${tag}" class="hashtag-link">#${tag}</a>`
              )
              .join("")}
          </div>
        `
            : ""
        }

        <!-- Post Stats -->
        <div class="post-stats">
          <div class="post-stat">
            <span class="stat-label">👍 ${post.like_count || 0}</span>
          </div>
          <div class="post-stat">
            <span class="stat-label">👎 ${post.dislike_count || 0}</span>
          </div>
          <div class="post-stat">
            <span class="stat-label">💬 ${post.comment_count || 0}</span>
          </div>
        </div>

        <!-- Post Actions -->
        <div class="post-actions">
          <!-- Like Button -->
          <button 
            class="post-action-btn ${userReaction === "like" ? "active" : ""}"
            onclick="handleReaction('${post.id}', 'like')"
            title="Like"
          >
            <svg fill="${
              userReaction === "like" ? "currentColor" : "none"
            }" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h-2m-2 0h-2m0 0H8a2 2 0 00-2 2v6a2 2 0 002 2h4V7m0 5V3a1 1 0 011-1h1a1 1 0 011 1v3" />
            </svg>
            <span class="action-text">Like</span>
          </button>

          <!-- Dislike Button -->
          <button 
            class="post-action-btn ${
              userReaction === "dislike" ? "active" : ""
            }"
            onclick="handleReaction('${post.id}', 'dislike')"
            title="Dislike"
          >
            <svg fill="${
              userReaction === "dislike" ? "currentColor" : "none"
            }" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14H8a2 2 0 00-2-2V6a2 2 0 002-2h4v14m0-5v5a1 1 0 001 1h1a1 1 0 001-1v-3" />
            </svg>
            <span class="action-text">Dislike</span>
          </button>

          <!-- Comment Button -->
          <button 
            class="post-action-btn"
            onclick="toggleCommentSection('${post.id}')"
            title="Comment"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <span class="action-text">Comment</span>
          </button>

          <!-- Save Button -->
          <button 
            class="post-action-btn ${isSaved ? "active" : ""}"
            onclick="handleSavePost('${post.id}')"
            title="Save"
          >
            <svg fill="${
              isSaved ? "currentColor" : "none"
            }" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 19V5z" />
            </svg>
            <span class="action-text">Save</span>
          </button>

          <!-- Share Button -->
          <button 
            class="post-action-btn"
            onclick="sharePost('${post.id}', '${
      post.community_profiles?.username
    }')"
            title="Share"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span class="action-text">Share</span>
          </button>

          <!-- More Options -->
          <button 
            class="post-action-btn"
            onclick="openPostMenu('${post.id}', '${post.author_id}', '${
      post.community_profiles?.username
    }')"
            title="More"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2m0 7a1 1 0 110-2 1 1 0 010 2m0 7a1 1 0 110-2 1 1 0 010 2" />
            </svg>
            <span class="action-text">More</span>
          </button>
        </div>

        <!-- Comment Section (Hidden by default) -->
        <div class="post-comment-section" id="comment-section-${
          post.id
        }" style="display: none;">
          <div class="comment-input-wrapper">
            <input 
              type="text"
              id="comment-input-${post.id}"
              placeholder="Write a comment..."
              class="comment-input"
            />
            <button 
              class="comment-submit-btn"
              onclick="postComment('${post.id}')"
            >
              Post
            </button>
          </div>
          <div class="comments-list" id="comments-list-${post.id}">
            <!-- Comments will be loaded here -->
          </div>
        </div>
      </div>
    `;

    return postHTML;
  }

  /**
   * Extract mentions from post content (@username)
   */
  extractMentions(content) {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  }

  /**
   * Extract hashtags from post content (#tag)
   */
  extractHashtags(content) {
    const hashtagRegex = /#(\w+)/g;
    const hashtags = [];
    let match;
    while ((match = hashtagRegex.exec(content)) !== null) {
      hashtags.push(match[1]);
    }
    return hashtags;
  }

  /**
   * Enrich content with links and formatting
   */
  enrichContent(content) {
    // Escape HTML
    let enriched = content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Add mention links
    enriched = enriched.replace(
      /@(\w+)/g,
      '<a href="/search.html?q=@$1" class="mention-link">@$1</a>'
    );

    // Add hashtag links
    enriched = enriched.replace(
      /#(\w+)/g,
      '<a href="/search.html?q=%23$1" class="hashtag-link">#$1</a>'
    );

    // Add URL links
    enriched = enriched.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" class="url-link">$1</a>'
    );

    // Preserve line breaks
    enriched = enriched.replace(/\n/g, "<br/>");

    return enriched;
  }

  /**
   * Format timestamp
   */
  formatTime(timestamp) {
    const now = new Date();
    const created = new Date(timestamp);
    const diffInSeconds = Math.floor((now - created) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return created.toLocaleDateString();
  }

  /**
   * Render story card
   */
  renderStory(story) {
    const isViewedByUser = story.viewed_at ? true : false;

    return `
      <div 
        class="story-card ${isViewedByUser ? "viewed" : ""}"
        data-story-id="${story.id}"
        onclick="viewStory('${story.id}', '${story.author_id}')"
      >
        <div class="story-image-wrapper">
          <img 
            data-lazy-src="${story.image_url}"
            alt="Story"
            class="story-image"
          />
          <div class="story-gradient"></div>
        </div>
        <div class="story-info">
          <img 
            data-lazy-src="${
              story.community_profiles?.avatar_url ||
              "/image/default-avatar.png"
            }"
            alt="${story.community_profiles?.display_name}"
            class="story-avatar"
          />
          <div class="story-details">
            <div class="story-username">${
              story.community_profiles?.username
            }</div>
            <div class="story-time">${this.formatTime(story.created_at)}</div>
          </div>
        </div>
        <div class="story-meta">
          <span class="story-views">👁️ ${story.view_count || 0}</span>
          <span class="story-expiry">⏱️ ${this.getStoryExpiry(
            story.expires_at
          )}</span>
        </div>
      </div>
    `;
  }

  /**
   * Get story expiry time
   */
  getStoryExpiry(expiresAt) {
    const expires = new Date(expiresAt);
    const now = new Date();
    const diffInSeconds = Math.floor((expires - now) / 1000);

    if (diffInSeconds < 0) return "Expired";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  }

  /**
   * Render comment card
   */
  renderComment(comment) {
    return `
      <div class="comment-card" data-comment-id="${comment.id}">
        <img 
          data-lazy-src="${
            comment.user?.avatar_url || "/image/default-avatar.png"
          }"
          alt="${comment.user?.display_name}"
          class="comment-avatar"
        />
        <div class="comment-content">
          <div class="comment-header">
            <strong class="comment-author">${
              comment.user?.display_name
            }</strong>
            <span class="comment-time">${this.formatTime(
              comment.created_at
            )}</span>
          </div>
          <div class="comment-text">${this.enrichContent(comment.content)}</div>
          <div class="comment-actions">
            <button class="comment-action" onclick="replyComment('${
              comment.id
            }')">
              Reply
            </button>
            ${
              comment.like_count
                ? `
              <span class="comment-stat">👍 ${comment.like_count}</span>
            `
                : ""
            }
          </div>
        </div>
      </div>
    `;
  }
}

// Global instance
let postCardRenderer = null;

document.addEventListener("DOMContentLoaded", () => {
  postCardRenderer = new PostCardRenderer({
    onLike: (postId) => console.log("Like:", postId),
    onDislike: (postId) => console.log("Dislike:", postId),
    onSave: (postId) => console.log("Save:", postId),
    onComment: (postId) => console.log("Comment:", postId),
  });
});
