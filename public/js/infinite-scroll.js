// Infinite Scroll Utility using Intersection Observer API

class InfiniteScroll {
  constructor(options = {}) {
    this.container = options.container || document.body;
    this.loadMoreCallback = options.onLoadMore || (() => {});
    this.threshold = options.threshold || 0.8;
    this.rootMargin = options.rootMargin || "100px";
    this.isLoading = false;
    this.hasMore = true;
    this.sentinel = null;
    this.observer = null;

    this.init();
  }

  init() {
    // Create sentinel element (invisible element at the bottom)
    this.sentinel = document.createElement("div");
    this.sentinel.className = "infinite-scroll-sentinel";
    this.sentinel.style.height = "1px";
    this.sentinel.style.visibility = "hidden";

    // Set up Intersection Observer
    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      {
        root: null, // viewport
        rootMargin: this.rootMargin,
        threshold: this.threshold,
      }
    );

    this.attachSentinel();
  }

  attachSentinel() {
    if (this.container && !this.container.contains(this.sentinel)) {
      this.container.appendChild(this.sentinel);
      this.observer.observe(this.sentinel);
    }
  }

  detachSentinel() {
    if (this.sentinel && this.sentinel.parentNode) {
      this.observer.unobserve(this.sentinel);
      this.sentinel.parentNode.removeChild(this.sentinel);
    }
  }

  async handleIntersection(entries) {
    const entry = entries[0];

    // Only load more when sentinel is visible, not already loading, and there's more content
    if (entry.isIntersecting && !this.isLoading && this.hasMore) {
      await this.loadMore();
    }
  }

  async loadMore() {
    if (this.isLoading || !this.hasMore) {
      return;
    }

    this.isLoading = true;
    this.showLoadingIndicator();

    try {
      const result = await this.loadMoreCallback();

      // Check if there's more content based on callback result
      if (result !== undefined && result !== null) {
        if (typeof result === "boolean") {
          this.hasMore = result;
        } else if (typeof result === "object") {
          this.hasMore = result.hasMore !== false;
        }
      }
    } catch (error) {
      console.error("Error loading more content:", error);
      this.hasMore = false;
    } finally {
      this.isLoading = false;
      this.hideLoadingIndicator();

      // If no more content, show end message
      if (!this.hasMore) {
        this.showEndMessage();
      }
    }
  }

  showLoadingIndicator() {
    // Check if loading indicator already exists
    let indicator = this.container.querySelector(".infinite-scroll-loading");

    if (!indicator) {
      indicator = document.createElement("div");
      indicator.className = "infinite-scroll-loading";
      indicator.innerHTML = `
                <div class="loading-spinner">
                    <svg viewBox="0 0 24 24" width="32" height="32">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" opacity="0.25"/>
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/>
                    </svg>
                    <span>Loading more...</span>
                </div>
            `;

      // Insert before sentinel
      this.container.insertBefore(indicator, this.sentinel);
    }

    indicator.style.display = "block";
  }

  hideLoadingIndicator() {
    const indicator = this.container.querySelector(".infinite-scroll-loading");
    if (indicator) {
      indicator.style.display = "none";
    }
  }

  showEndMessage() {
    // Remove sentinel since we don't need it anymore
    this.detachSentinel();

    // Check if end message already exists
    let endMessage = this.container.querySelector(".infinite-scroll-end");

    if (!endMessage) {
      endMessage = document.createElement("div");
      endMessage.className = "infinite-scroll-end";
      endMessage.innerHTML = `
                <div class="end-message">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    <span>You've reached the end</span>
                </div>
            `;
      this.container.appendChild(endMessage);
    }
  }

  // Public methods
  setHasMore(hasMore) {
    this.hasMore = hasMore;

    if (!hasMore) {
      this.showEndMessage();
    }
  }

  reset() {
    this.hasMore = true;
    this.isLoading = false;

    // Remove end message if exists
    const endMessage = this.container.querySelector(".infinite-scroll-end");
    if (endMessage) {
      endMessage.remove();
    }

    // Remove loading indicator if exists
    const loadingIndicator = this.container.querySelector(
      ".infinite-scroll-loading"
    );
    if (loadingIndicator) {
      loadingIndicator.remove();
    }

    // Reattach sentinel
    this.detachSentinel();
    this.attachSentinel();
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }

    this.detachSentinel();

    // Remove loading indicator
    const loadingIndicator = this.container.querySelector(
      ".infinite-scroll-loading"
    );
    if (loadingIndicator) {
      loadingIndicator.remove();
    }

    // Remove end message
    const endMessage = this.container.querySelector(".infinite-scroll-end");
    if (endMessage) {
      endMessage.remove();
    }
  }

  pause() {
    if (this.sentinel && this.observer) {
      this.observer.unobserve(this.sentinel);
    }
  }

  resume() {
    if (this.sentinel && this.observer) {
      this.observer.observe(this.sentinel);
    }
  }
}

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = InfiniteScroll;
}
