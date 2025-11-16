// Pull-to-Refresh Utility for Mobile

class PullToRefresh {
  constructor(options = {}) {
    this.container = options.container || document.body;
    this.onRefresh = options.onRefresh || (() => Promise.resolve());
    this.threshold = options.threshold || 80;
    this.maxPull = options.maxPull || 120;
    this.resistance = options.resistance || 2.5;

    this.startY = 0;
    this.currentY = 0;
    this.pullDistance = 0;
    this.isRefreshing = false;
    this.isPulling = false;
    this.canPull = false;

    this.refreshElement = null;
    this.init();
  }

  init() {
    // Create refresh indicator element
    this.createRefreshElement();

    // Bind event listeners
    this.container.addEventListener(
      "touchstart",
      this.handleTouchStart.bind(this),
      { passive: false }
    );
    this.container.addEventListener(
      "touchmove",
      this.handleTouchMove.bind(this),
      { passive: false }
    );
    this.container.addEventListener(
      "touchend",
      this.handleTouchEnd.bind(this),
      { passive: false }
    );

    // For desktop testing
    if (window.matchMedia("(min-width: 768px)").matches) {
      this.container.addEventListener(
        "mousedown",
        this.handleMouseDown.bind(this)
      );
      this.container.addEventListener(
        "mousemove",
        this.handleMouseMove.bind(this)
      );
      this.container.addEventListener(
        "mouseup",
        this.handleMouseEnd.bind(this)
      );
    }
  }

  createRefreshElement() {
    this.refreshElement = document.createElement("div");
    this.refreshElement.className = "pull-to-refresh-indicator";
    this.refreshElement.innerHTML = `
            <div class="ptr-content">
                <div class="ptr-spinner">
                    <svg viewBox="0 0 24 24" width="32" height="32">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" opacity="0.25"/>
                        <path class="ptr-spinner-path" d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/>
                    </svg>
                </div>
                <div class="ptr-arrow">
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
                    </svg>
                </div>
                <div class="ptr-text">Pull to refresh</div>
            </div>
        `;

    // Insert at the beginning of container
    if (this.container.firstChild) {
      this.container.insertBefore(
        this.refreshElement,
        this.container.firstChild
      );
    } else {
      this.container.appendChild(this.refreshElement);
    }
  }

  handleTouchStart(e) {
    // Only allow pull-to-refresh when at the top of the page
    if (this.isRefreshing) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    this.canPull = scrollTop === 0;

    if (this.canPull) {
      this.startY = e.touches[0].clientY;
      this.isPulling = false;
    }
  }

  handleTouchMove(e) {
    if (!this.canPull || this.isRefreshing) return;

    this.currentY = e.touches[0].clientY;
    this.pullDistance = this.currentY - this.startY;

    // Only handle downward pulls
    if (this.pullDistance > 0) {
      this.isPulling = true;

      // Prevent default scrolling
      e.preventDefault();

      // Apply resistance to make it feel natural
      const resistedDistance = this.pullDistance / this.resistance;
      const clampedDistance = Math.min(resistedDistance, this.maxPull);

      this.updateRefreshElement(clampedDistance);
    }
  }

  handleTouchEnd(e) {
    if (!this.isPulling || this.isRefreshing) {
      this.isPulling = false;
      return;
    }

    this.isPulling = false;

    const resistedDistance = this.pullDistance / this.resistance;

    if (resistedDistance >= this.threshold) {
      this.triggerRefresh();
    } else {
      this.resetRefreshElement();
    }

    this.startY = 0;
    this.currentY = 0;
    this.pullDistance = 0;
  }

  // Desktop testing methods
  handleMouseDown(e) {
    if (this.isRefreshing) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    this.canPull = scrollTop === 0;

    if (this.canPull) {
      this.startY = e.clientY;
      this.isPulling = false;
    }
  }

  handleMouseMove(e) {
    if (!this.canPull || this.isRefreshing || !this.startY) return;

    this.currentY = e.clientY;
    this.pullDistance = this.currentY - this.startY;

    if (this.pullDistance > 0) {
      this.isPulling = true;
      e.preventDefault();

      const resistedDistance = this.pullDistance / this.resistance;
      const clampedDistance = Math.min(resistedDistance, this.maxPull);

      this.updateRefreshElement(clampedDistance);
    }
  }

  handleMouseEnd(e) {
    if (!this.isPulling || this.isRefreshing) {
      this.isPulling = false;
      this.startY = 0;
      return;
    }

    this.isPulling = false;

    const resistedDistance = this.pullDistance / this.resistance;

    if (resistedDistance >= this.threshold) {
      this.triggerRefresh();
    } else {
      this.resetRefreshElement();
    }

    this.startY = 0;
    this.currentY = 0;
    this.pullDistance = 0;
  }

  updateRefreshElement(distance) {
    const percentage = Math.min(distance / this.threshold, 1);

    this.refreshElement.style.height = `${distance}px`;
    this.refreshElement.style.opacity = percentage;

    const content = this.refreshElement.querySelector(".ptr-content");
    content.style.transform = `translateY(0)`;

    // Rotate arrow based on pull distance
    const arrow = this.refreshElement.querySelector(".ptr-arrow");
    const rotation = percentage * 180;
    arrow.style.transform = `rotate(${rotation}deg)`;

    // Update text based on threshold
    const text = this.refreshElement.querySelector(".ptr-text");
    if (distance >= this.threshold) {
      text.textContent = "Release to refresh";
      this.refreshElement.classList.add("ptr-ready");
    } else {
      text.textContent = "Pull to refresh";
      this.refreshElement.classList.remove("ptr-ready");
    }
  }

  async triggerRefresh() {
    this.isRefreshing = true;
    this.refreshElement.classList.add("ptr-refreshing");
    this.refreshElement.classList.remove("ptr-ready");

    const text = this.refreshElement.querySelector(".ptr-text");
    text.textContent = "Refreshing...";

    this.refreshElement.style.height = `${this.threshold}px`;
    this.refreshElement.style.opacity = "1";

    try {
      await this.onRefresh();

      // Show success state briefly
      this.refreshElement.classList.add("ptr-success");
      text.textContent = "Updated!";

      setTimeout(() => {
        this.resetRefreshElement();
      }, 500);
    } catch (error) {
      console.error("Refresh failed:", error);

      // Show error state briefly
      this.refreshElement.classList.add("ptr-error");
      text.textContent = "Failed to refresh";

      setTimeout(() => {
        this.resetRefreshElement();
      }, 1000);
    }
  }

  resetRefreshElement() {
    this.refreshElement.style.height = "0";
    this.refreshElement.style.opacity = "0";

    setTimeout(() => {
      this.isRefreshing = false;
      this.refreshElement.classList.remove(
        "ptr-refreshing",
        "ptr-success",
        "ptr-error",
        "ptr-ready"
      );

      const text = this.refreshElement.querySelector(".ptr-text");
      text.textContent = "Pull to refresh";

      const arrow = this.refreshElement.querySelector(".ptr-arrow");
      arrow.style.transform = "rotate(0deg)";
    }, 300);
  }

  destroy() {
    // Remove event listeners
    this.container.removeEventListener("touchstart", this.handleTouchStart);
    this.container.removeEventListener("touchmove", this.handleTouchMove);
    this.container.removeEventListener("touchend", this.handleTouchEnd);
    this.container.removeEventListener("mousedown", this.handleMouseDown);
    this.container.removeEventListener("mousemove", this.handleMouseMove);
    this.container.removeEventListener("mouseup", this.handleMouseEnd);

    // Remove refresh element
    if (this.refreshElement && this.refreshElement.parentNode) {
      this.refreshElement.parentNode.removeChild(this.refreshElement);
    }
  }

  enable() {
    this.canPull = true;
  }

  disable() {
    this.canPull = false;
    this.resetRefreshElement();
  }
}

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = PullToRefresh;
}
