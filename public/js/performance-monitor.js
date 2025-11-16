/**
 * Performance Monitoring & Optimization
 * Tracks Core Web Vitals, resource loading, and provides optimization recommendations
 */

class PerformanceMonitor {
  constructor(options = {}) {
    this.metrics = {};
    this.thresholds = {
      LCP: options.lcpThreshold || 2500, // Largest Contentful Paint
      FID: options.fidThreshold || 100, // First Input Delay
      CLS: options.clsThreshold || 0.1, // Cumulative Layout Shift
    };
    this.enableReporting = options.enableReporting !== false;
    this.init();
  }

  /**
   * Initialize performance monitoring
   */
  init() {
    this.measureNavigationTiming();
    this.measureCoreWebVitals();
    this.monitorResourceTiming();
    this.monitorMemoryUsage();
  }

  /**
   * Measure navigation timing
   */
  measureNavigationTiming() {
    if (!window.performance || !window.performance.timing) return;

    window.addEventListener("load", () => {
      setTimeout(() => {
        const timing = window.performance.timing;
        const navigationStart = timing.navigationStart;

        this.metrics.navigationTiming = {
          dns: timing.domainLookupEnd - timing.domainLookupStart,
          tcp: timing.connectEnd - timing.connectStart,
          ttfb: timing.responseStart - navigationStart,
          download: timing.responseEnd - timing.responseStart,
          domInteractive: timing.domInteractive - navigationStart,
          domContentLoaded: timing.domContentLoadedEventEnd - navigationStart,
          pageLoad: timing.loadEventEnd - navigationStart,
        };

        if (this.enableReporting) {
          console.log("📊 Navigation Timing:", this.metrics.navigationTiming);
        }
      }, 0);
    });
  }

  /**
   * Measure Core Web Vitals using PerformanceObserver
   */
  measureCoreWebVitals() {
    // Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;

        if (this.enableReporting) {
          console.log("🖼️  LCP:", `${this.metrics.lcp.toFixed(2)}ms`);
        }

        if (this.metrics.lcp > this.thresholds.LCP) {
          console.warn(
            `⚠️  LCP threshold exceeded: ${this.metrics.lcp}ms > ${this.thresholds.LCP}ms`
          );
        }
      });

      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
    } catch (e) {
      console.debug("LCP not supported", e);
    }

    // First Input Delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const fid = entry.processingEnd - entry.startTime;
          this.metrics.fid = Math.max(this.metrics.fid || 0, fid);

          if (this.enableReporting && this.metrics.fid) {
            console.log("⚡ FID:", `${this.metrics.fid.toFixed(2)}ms`);
          }

          if (this.metrics.fid > this.thresholds.FID) {
            console.warn(
              `⚠️  FID threshold exceeded: ${this.metrics.fid}ms > ${this.thresholds.FID}ms`
            );
          }
        });
      });

      fidObserver.observe({ entryTypes: ["first-input"] });
    } catch (e) {
      console.debug("FID not supported", e);
    }

    // Cumulative Layout Shift
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.metrics.cls = clsValue;

            if (this.enableReporting) {
              console.log("📏 CLS:", this.metrics.cls.toFixed(4));
            }

            if (clsValue > this.thresholds.CLS) {
              console.warn(
                `⚠️  CLS threshold exceeded: ${clsValue} > ${this.thresholds.CLS}`
              );
            }
          }
        });
      });

      clsObserver.observe({ entryTypes: ["layout-shift"] });
    } catch (e) {
      console.debug("CLS not supported", e);
    }
  }

  /**
   * Monitor resource timing
   */
  monitorResourceTiming() {
    if (!window.PerformanceObserver) return;

    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        entries.forEach((entry) => {
          const duration = entry.duration;
          const size = entry.transferSize || 0;
          const resource = {
            name: entry.name,
            duration: duration.toFixed(2),
            size: (size / 1024).toFixed(2),
            type: entry.initiatorType,
          };

          if (!this.metrics.resources) {
            this.metrics.resources = [];
          }

          this.metrics.resources.push(resource);

          // Warn if resource takes too long
          if (duration > 3000) {
            console.warn(
              `⚠️  Slow resource: ${entry.name} (${duration.toFixed(2)}ms)`
            );
          }
        });
      });

      resourceObserver.observe({ entryTypes: ["resource"] });
    } catch (e) {
      console.debug("Resource timing not supported", e);
    }
  }

  /**
   * Monitor memory usage (if available)
   */
  monitorMemoryUsage() {
    if (!performance.memory) return;

    setInterval(() => {
      const memory = {
        used: (performance.memory.usedJSHeapSize / 1048576).toFixed(2),
        total: (performance.memory.totalJSHeapSize / 1048576).toFixed(2),
        limit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2),
      };

      this.metrics.memory = memory;

      // Warn if memory usage is high
      const usedPercent = (memory.used / memory.limit) * 100;
      if (usedPercent > 90) {
        console.warn(`⚠️  High memory usage: ${usedPercent.toFixed(2)}%`);
      }
    }, 5000);
  }

  /**
   * Get all metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Get performance score
   */
  getPerformanceScore() {
    let score = 100;

    // Deduct points based on vitals
    if (this.metrics.lcp > this.thresholds.LCP) {
      score -= 25;
    }
    if (this.metrics.fid > this.thresholds.FID) {
      score -= 25;
    }
    if (this.metrics.cls > this.thresholds.CLS) {
      score -= 25;
    }

    // Deduct points for slow resources
    if (this.metrics.resources) {
      const slowResources = this.metrics.resources.filter(
        (r) => r.duration > 3000
      ).length;
      score -= slowResources * 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get optimization recommendations
   */
  getRecommendations() {
    const recommendations = [];

    if (this.metrics.lcp > this.thresholds.LCP) {
      recommendations.push(
        "🖼️  Improve LCP: Optimize images, reduce CSS, use lazy loading"
      );
    }

    if (this.metrics.fid > this.thresholds.FID) {
      recommendations.push(
        "⚡ Improve FID: Break up long tasks, optimize JavaScript"
      );
    }

    if (this.metrics.cls > this.thresholds.CLS) {
      recommendations.push(
        "📏 Reduce CLS: Reserve space for dynamic content, use size attributes"
      );
    }

    if (this.metrics.navigationTiming?.ttfb > 600) {
      recommendations.push(
        "🚀 Improve TTFB: Use CDN, optimize server response, cache static assets"
      );
    }

    if (this.metrics.resources) {
      const largeResources = this.metrics.resources.filter((r) => r.size > 500);
      if (largeResources.length > 0) {
        recommendations.push(
          `📦 Optimize resources: ${largeResources.length} large resources detected`
        );
      }
    }

    return recommendations;
  }

  /**
   * Generate performance report
   */
  generateReport() {
    const score = this.getPerformanceScore();
    const recommendations = this.getRecommendations();

    const report = {
      score,
      metrics: this.metrics,
      recommendations,
      timestamp: new Date().toISOString(),
    };

    return report;
  }

  /**
   * Send metrics to analytics service
   */
  sendMetrics(endpoint = "/api/metrics") {
    const report = this.generateReport();

    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, JSON.stringify(report));
    } else {
      // Fallback to fetch
      fetch(endpoint, {
        method: "POST",
        body: JSON.stringify(report),
        keepalive: true,
      }).catch(() => {
        // Silently fail
      });
    }
  }

  /**
   * Print performance report to console
   */
  printReport() {
    const report = this.generateReport();

    console.group("📈 Performance Report");
    console.log(`Score: ${report.score}/100`);
    console.log("Metrics:", report.metrics);
    console.log("Recommendations:");
    report.recommendations.forEach((rec) => console.log(`  ${rec}`));
    console.groupEnd();
  }
}

// Global instance
let performanceMonitor = null;

// Initialize on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    performanceMonitor = new PerformanceMonitor({ enableReporting: true });
  });
} else {
  performanceMonitor = new PerformanceMonitor({ enableReporting: true });
}

// Send report on page visibility change
document.addEventListener("visibilitychange", () => {
  if (document.hidden && performanceMonitor) {
    performanceMonitor.sendMetrics();
  }
});
