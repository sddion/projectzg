/**
 * Module Loader & Code Splitting Utility
 * Handles dynamic imports, module caching, and error recovery
 */

class ModuleLoader {
  constructor(options = {}) {
    this.moduleCache = new Map();
    this.loadingModules = new Map();
    this.failedModules = new Set();
    this.retryAttempts = options.retryAttempts || 3;
    this.timeout = options.timeout || 10000;
    this.moduleMap = options.moduleMap || this.getDefaultModuleMap();
  }

  /**
   * Get default module map
   */
  getDefaultModuleMap() {
    return {
      "post-card": "/js/components/post-card.js",
      "story-card": "/js/components/story-card.js",
      "user-profile": "/js/components/user-profile.js",
      "comment-section": "/js/components/comment-section.js",
      "notification-item": "/js/components/notification-item.js",
      "feed-page": "/js/pages/feed-page.js",
      "profile-page": "/js/pages/profile-page.js",
      "search-page": "/js/pages/search-page.js",
    };
  }

  /**
   * Load module with caching and error handling
   */
  async loadModule(moduleName, retryCount = 0) {
    // Return cached module if available
    if (this.moduleCache.has(moduleName)) {
      return this.moduleCache.get(moduleName);
    }

    // Return loading promise if already loading
    if (this.loadingModules.has(moduleName)) {
      return this.loadingModules.get(moduleName);
    }

    // Check if module has previously failed
    if (this.failedModules.has(moduleName)) {
      console.warn(`Module '${moduleName}' previously failed to load`);
      return null;
    }

    // Create loading promise
    const loadingPromise = this._loadModuleWithRetry(moduleName, retryCount);
    this.loadingModules.set(moduleName, loadingPromise);

    try {
      const module = await loadingPromise;
      this.moduleCache.set(moduleName, module);
      return module;
    } catch (error) {
      this.failedModules.add(moduleName);
      console.error(`Failed to load module '${moduleName}':`, error);
      return null;
    } finally {
      this.loadingModules.delete(moduleName);
    }
  }

  /**
   * Load module with retry logic
   */
  async _loadModuleWithRetry(moduleName, retryCount = 0) {
    const modulePath = this.moduleMap[moduleName];

    if (!modulePath) {
      throw new Error(`Module '${moduleName}' not found in module map`);
    }

    try {
      return await this._loadModuleWithTimeout(modulePath);
    } catch (error) {
      if (retryCount < this.retryAttempts) {
        console.warn(
          `Retrying module load for '${moduleName}' (attempt ${retryCount + 1})`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (retryCount + 1))
        );
        return this._loadModuleWithRetry(moduleName, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Load module with timeout
   */
  async _loadModuleWithTimeout(modulePath) {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`Module load timeout: ${modulePath}`)),
        this.timeout
      )
    );

    const importPromise = import(modulePath);

    return Promise.race([importPromise, timeoutPromise]);
  }

  /**
   * Preload modules eagerly
   */
  async preloadModules(moduleNames) {
    const promises = moduleNames.map((name) => this.loadModule(name));
    await Promise.allSettled(promises);
  }

  /**
   * Prefetch modules for potential future use
   */
  async prefetchModules(moduleNames) {
    // Start loading but don't wait
    moduleNames.forEach((name) => {
      if (!this.moduleCache.has(name)) {
        this.loadModule(name).catch(() => {
          // Silently fail on prefetch
        });
      }
    });
  }

  /**
   * Clear module cache
   */
  clearCache(moduleName = null) {
    if (moduleName) {
      this.moduleCache.delete(moduleName);
      this.failedModules.delete(moduleName);
    } else {
      this.moduleCache.clear();
      this.failedModules.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      cached: this.moduleCache.size,
      loading: this.loadingModules.size,
      failed: this.failedModules.size,
      total: Object.keys(this.moduleMap).length,
    };
  }
}

// Global instance
let moduleLoader = null;

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  moduleLoader = new ModuleLoader();
});

/**
 * Route-based code splitting utility
 * Preload modules based on likely navigation patterns
 */
class RoutePreloader {
  constructor() {
    this.currentRoute = this.getCurrentRoute();
    this.routeModuleMap = {
      "/home.html": ["post-card", "story-card", "comment-section"],
      "/feeds.html": ["post-card", "comment-section", "user-profile"],
      "/profile.html": ["user-profile", "post-card"],
      "/search.html": ["user-profile", "post-card"],
      "/notifications.html": ["notification-item", "user-profile"],
    };

    this.init();
  }

  /**
   * Initialize route preloader
   */
  async init() {
    // Preload current route modules
    const currentModules = this.routeModuleMap[this.currentRoute] || [];
    if (moduleLoader && currentModules.length > 0) {
      await moduleLoader.preloadModules(currentModules);
    }

    // Prefetch adjacent route modules on idle
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => this.prefetchAdjacentRoutes(), {
        timeout: 3000,
      });
    } else {
      setTimeout(() => this.prefetchAdjacentRoutes(), 1000);
    }
  }

  /**
   * Get current route from URL
   */
  getCurrentRoute() {
    return "/" + (window.location.pathname.split("/").pop() || "home.html");
  }

  /**
   * Prefetch modules for adjacent routes
   */
  async prefetchAdjacentRoutes() {
    const allModules = Object.values(this.routeModuleMap).flat();
    const uniqueModules = [...new Set(allModules)];

    if (moduleLoader) {
      await moduleLoader.prefetchModules(uniqueModules);
    }
  }
}

// Initialize route preloader
document.addEventListener("DOMContentLoaded", () => {
  new RoutePreloader();
});
