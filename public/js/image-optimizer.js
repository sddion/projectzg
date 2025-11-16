/**
 * Image Optimization & Responsive Loading
 * Provides responsive image serving, srcset generation, and WebP support
 */

class ImageOptimizer {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || "/image";
    this.enableWebP = this.checkWebPSupport();
    this.enableAVIF = this.checkAVIFSupport();
    this.imageSizes = options.imageSizes || {
      thumbnail: 150,
      small: 300,
      medium: 600,
      large: 1200,
      xlarge: 1920,
    };
  }

  /**
   * Check WebP browser support
   */
  checkWebPSupport() {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    return canvas.toDataURL("image/webp").indexOf("image/webp") === 5;
  }

  /**
   * Check AVIF browser support
   */
  checkAVIFSupport() {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    try {
      return canvas.toDataURL("image/avif").indexOf("image/avif") === 5;
    } catch (e) {
      return false;
    }
  }

  /**
   * Generate responsive image URLs for different breakpoints
   */
  generateSrcSet(imagePath, format = "original") {
    const ext = this.getExtension(imagePath);
    const basePath = imagePath.replace(`.${ext}`, "");

    const sizes = Object.entries(this.imageSizes)
      .map(([name, size]) => {
        let url;

        if (this.enableAVIF && format !== "original") {
          url = `${basePath}-${size}w.avif`;
        } else if (this.enableWebP && format !== "original") {
          url = `${basePath}-${size}w.webp`;
        } else {
          url = `${basePath}-${size}w.${ext}`;
        }

        return `${url} ${size}w`;
      })
      .join(", ");

    return sizes;
  }

  /**
   * Generate responsive image HTML
   */
  generateResponsiveImage(imagePath, options = {}) {
    const {
      alt = "Image",
      title = "",
      className = "",
      lazy = true,
      lowQuality = null,
    } = options;

    const ext = this.getExtension(imagePath);
    const basePath = imagePath.replace(`.${ext}`, "");

    let picureHTML = "<picture>";

    // Add AVIF support
    if (this.enableAVIF) {
      const avifSrcSet = Object.entries(this.imageSizes)
        .map(([, size]) => `${basePath}-${size}w.avif ${size}w`)
        .join(", ");
      picureHTML += `<source srcset="${avifSrcSet}" type="image/avif">`;
    }

    // Add WebP support
    if (this.enableWebP) {
      const webpSrcSet = Object.entries(this.imageSizes)
        .map(([, size]) => `${basePath}-${size}w.webp ${size}w`)
        .join(", ");
      picureHTML += `<source srcset="${webpSrcSet}" type="image/webp">`;
    }

    // Add original format with srcset
    const originalSrcSet = Object.entries(this.imageSizes)
      .map(([, size]) => `${basePath}-${size}w.${ext} ${size}w`)
      .join(", ");

    if (lazy) {
      picureHTML += `
        <img
          data-lazy-src="${imagePath}"
          data-low-quality-src="${
            lowQuality || this.generateLowQualityImage(imagePath)
          }"
          alt="${alt}"
          title="${title}"
          class="responsive-image ${className}"
          loading="lazy"
          decoding="async"
        />
      `;
    } else {
      picureHTML += `
        <img
          src="${imagePath}"
          srcset="${originalSrcSet}"
          alt="${alt}"
          title="${title}"
          class="responsive-image ${className}"
          decoding="async"
        />
      `;
    }

    picureHTML += "</picture>";

    return picureHTML;
  }

  /**
   * Generate low-quality image placeholder (LQIP)
   */
  generateLowQualityImage(imagePath) {
    const ext = this.getExtension(imagePath);
    const basePath = imagePath.replace(`.${ext}`, "");

    // Try to find pre-generated thumbnail, fallback to original with blur
    return `${basePath}-150w.${ext}`;
  }

  /**
   * Get image extension
   */
  getExtension(imagePath) {
    return imagePath.split(".").pop().toLowerCase();
  }

  /**
   * Create image URL with size and format parameters
   */
  getImageUrl(imagePath, size = "medium", format = "webp") {
    const ext = this.getExtension(imagePath);
    const basePath = imagePath.replace(`.${ext}`, "");
    const sizeValue = this.imageSizes[size] || size;

    if (format === "auto") {
      if (this.enableAVIF) return `${basePath}-${sizeValue}w.avif`;
      if (this.enableWebP) return `${basePath}-${sizeValue}w.webp`;
      return `${basePath}-${sizeValue}w.${ext}`;
    }

    return `${basePath}-${sizeValue}w.${format}`;
  }

  /**
   * Batch optimize multiple images
   */
  optimizeImages(selector = "img[data-optimize]") {
    const images = document.querySelectorAll(selector);

    images.forEach((img) => {
      const src = img.src || img.dataset.src;
      const alt = img.alt || "Image";
      const lazy = img.dataset.lazy !== "false";

      const responsiveHTML = this.generateResponsiveImage(src, {
        alt,
        className: img.className,
        lazy,
      });

      img.outerHTML = responsiveHTML;
    });
  }

  /**
   * Get optimal image format for current device
   */
  getOptimalFormat() {
    if (this.enableAVIF) return "avif";
    if (this.enableWebP) return "webp";
    return "jpeg";
  }

  /**
   * Preload critical images
   */
  preloadImages(imagePaths) {
    imagePaths.forEach((imagePath) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = imagePath;
      document.head.appendChild(link);
    });
  }

  /**
   * Prefetch images for faster loading
   */
  prefetchImages(imagePaths) {
    imagePaths.forEach((imagePath) => {
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.as = "image";
      link.href = imagePath;
      document.head.appendChild(link);
    });
  }
}

// Global instance
let imageOptimizer = null;

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  imageOptimizer = new ImageOptimizer();
});
