/**
 * Comprehensive Lazy Loading Utility
 * Handles: Images, Components, Dynamic Imports, Code Splitting
 */

class LazyLoadManager {
  constructor(options = {}) {
    this.imageObserver = null;
    this.componentObserver = null;
    this.imageLoadTimeout = options.imageLoadTimeout || 15000;
    this.retryAttempts = options.retryAttempts || 3;
    this.initImageLazyLoading();
    this.initComponentLazyLoading();
  }

  /**
   * Initialize lazy loading for images with blur-up effect
   */
  initImageLazyLoading() {
    const imageConfig = {
      root: null,
      rootMargin: "50px",
      threshold: 0.01,
    };

    this.imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.loadImage(entry.target);
        }
      });
    }, imageConfig);

    // Observe all images with data-lazy-src
    document.querySelectorAll("img[data-lazy-src]").forEach((img) => {
      this.imageObserver.observe(img);
    });
  }

  /**
   * Load image with retry logic and error handling
   */
  loadImage(img, attempt = 1) {
    if (!img.dataset.lazySrc) return;

    const src = img.dataset.lazySrc;
    const lowQualitySrc = img.dataset.lowQualitySrc;

    // Add blur-up effect with low-quality placeholder
    if (lowQualitySrc && !img.src) {
      img.src = lowQualitySrc;
      img.style.filter = "blur(8px)";
    }

    const tempImg = new Image();

    const onSuccess = () => {
      img.src = src;
      img.style.filter = "blur(0)";
      img.style.transition = "filter 0.3s ease-in-out";
      img.classList.add("lazy-loaded");
      img.removeAttribute("data-lazy-src");

      if (this.imageObserver && img) {
        this.imageObserver.unobserve(img);
      }
    };

    const onError = () => {
      if (attempt < this.retryAttempts) {
        setTimeout(() => {
          this.loadImage(img, attempt + 1);
        }, 1000 * attempt);
      } else {
        img.src = lowQualitySrc || "/image/placeholder.png";
        img.classList.add("lazy-failed");
        if (this.imageObserver && img) {
          this.imageObserver.unobserve(img);
        }
      }
    };

    tempImg.onload = onSuccess;
    tempImg.onerror = onError;

    setTimeout(() => {
      tempImg.src = src;
    }, 100);

    // Timeout fallback
    setTimeout(() => {
      if (
        !img.classList.contains("lazy-loaded") &&
        !img.classList.contains("lazy-failed")
      ) {
        onError();
      }
    }, this.imageLoadTimeout);
  }

  /**
   * Initialize lazy loading for components
   */
  initComponentLazyLoading() {
    const componentConfig = {
      root: null,
      rootMargin: "100px",
      threshold: 0,
    };

    this.componentObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.loadComponent(entry.target);
        }
      });
    }, componentConfig);

    // Observe all components with data-lazy-component
    document.querySelectorAll("[data-lazy-component]").forEach((component) => {
      this.componentObserver.observe(component);
    });
  }

  /**
   * Load component dynamically with placeholder
   */
  async loadComponent(component) {
    const componentName = component.dataset.lazyComponent;
    const placeholder = component.dataset.placeholder || true;

    if (!componentName) return;

    try {
      // Show skeleton loader
      if (placeholder) {
        component.innerHTML = this.getSkeletonLoader(componentName);
      }

      // Dynamic import based on component name
      const module = await this.importComponent(componentName);

      if (module && typeof module.render === "function") {
        component.innerHTML = "";
        await module.render(component, component.dataset);
      }

      component.classList.add("component-loaded");
    } catch (error) {
      console.error(`Failed to load component: ${componentName}`, error);
      component.innerHTML = `<div class="component-error">Failed to load ${componentName}</div>`;
    } finally {
      if (this.componentObserver && component) {
        this.componentObserver.unobserve(component);
      }
    }
  }

  /**
   * Dynamic component import
   */
  async importComponent(componentName) {
    const moduleMap = {
      "post-card": () => import("./components/post-card.js"),
      "story-card": () => import("./components/story-card.js"),
      "user-profile": () => import("./components/user-profile.js"),
      "comment-section": () => import("./components/comment-section.js"),
      "notification-item": () => import("./components/notification-item.js"),
    };

    if (moduleMap[componentName]) {
      return await moduleMap[componentName]();
    }

    throw new Error(`Unknown component: ${componentName}`);
  }

  /**
   * Get skeleton loader HTML based on component type
   */
  getSkeletonLoader(componentType) {
    const skeletons = {
      "post-card": `
        <div class="skeleton-loader">
          <div class="skeleton skeleton-avatar"></div>
          <div class="skeleton skeleton-text" style="width: 60%;"></div>
          <div class="skeleton skeleton-text" style="width: 40%;"></div>
          <div class="skeleton skeleton-image"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text" style="width: 80%;"></div>
        </div>
      `,
      "story-card": `
        <div class="skeleton-loader skeleton-story">
          <div class="skeleton skeleton-avatar"></div>
        </div>
      `,
      "user-profile": `
        <div class="skeleton-loader">
          <div class="skeleton skeleton-avatar" style="width: 80px; height: 80px;"></div>
          <div class="skeleton skeleton-text" style="width: 40%;"></div>
          <div class="skeleton skeleton-text" style="width: 60%;"></div>
        </div>
      `,
      "comment-section": `
        <div class="skeleton-loader">
          <div class="skeleton skeleton-avatar"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text" style="width: 80%;"></div>
        </div>
      `,
      "notification-item": `
        <div class="skeleton-loader">
          <div class="skeleton skeleton-avatar"></div>
          <div class="skeleton skeleton-text" style="width: 70%;"></div>
          <div class="skeleton skeleton-text" style="width: 50%;"></div>
        </div>
      `,
    };

    return skeletons[componentType] || skeletons["post-card"];
  }

  /**
   * Observe new lazy-loaded elements
   */
  observeNewElements() {
    document
      .querySelectorAll("img[data-lazy-src]:not(.lazy-observed)")
      .forEach((img) => {
        img.classList.add("lazy-observed");
        this.imageObserver.observe(img);
      });

    document
      .querySelectorAll("[data-lazy-component]:not(.component-observed)")
      .forEach((component) => {
        component.classList.add("component-observed");
        this.componentObserver.observe(component);
      });
  }

  /**
   * Preload critical resources
   */
  async preloadCritical(urls) {
    const links = document.head.querySelectorAll('link[rel="preload"]');
    const preloadedUrls = Array.from(links).map((l) => l.href);

    for (const url of urls) {
      if (!preloadedUrls.includes(url)) {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = url.endsWith(".js")
          ? "script"
          : url.endsWith(".css")
          ? "style"
          : "fetch";
        link.href = url;
        document.head.appendChild(link);
      }
    }
  }

  /**
   * Prefetch low-priority resources
   */
  prefetch(urls) {
    for (const url of urls) {
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = url;
      document.head.appendChild(link);
    }
  }

  /**
   * Cleanup observers
   */
  destroy() {
    if (this.imageObserver) {
      this.imageObserver.disconnect();
    }
    if (this.componentObserver) {
      this.componentObserver.disconnect();
    }
  }
}

// Global instance
let lazyLoadManager = null;

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  lazyLoadManager = new LazyLoadManager();
});

// Observe new elements added dynamically
const mutationObserver = new MutationObserver(() => {
  if (lazyLoadManager) {
    lazyLoadManager.observeNewElements();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
});
