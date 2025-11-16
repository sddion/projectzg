// Toast Notification System
// Provides elegant toast notifications with animations and various types

class Toast {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    // Create toast container if it doesn't exist
    if (!document.getElementById("toast-container")) {
      this.container = document.createElement("div");
      this.container.id = "toast-container";
      this.container.className = "toast-container";
      document.body.appendChild(this.container);
    } else {
      this.container = document.getElementById("toast-container");
    }
  }

  show(message, type = "info", duration = 3000) {
    const toast = this.createToast(message, type);
    this.container.appendChild(toast);

    // Trigger animation
    setTimeout(() => {
      toast.classList.add("toast-show");
    }, 10);

    // Auto dismiss
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(toast);
      }, duration);
    }

    return toast;
  }

  createToast(message, type) {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    const icon = this.getIcon(type);
    const closeBtn = document.createElement("button");
    closeBtn.className = "toast-close";
    closeBtn.innerHTML = "&times;";
    closeBtn.onclick = () => this.dismiss(toast);

    const content = document.createElement("div");
    content.className = "toast-content";

    const iconEl = document.createElement("div");
    iconEl.className = "toast-icon";
    iconEl.innerHTML = icon;

    const messageEl = document.createElement("div");
    messageEl.className = "toast-message";
    messageEl.textContent = message;

    content.appendChild(iconEl);
    content.appendChild(messageEl);
    toast.appendChild(content);
    toast.appendChild(closeBtn);

    return toast;
  }

  getIcon(type) {
    const icons = {
      success: `<svg fill="currentColor" viewBox="0 0 20 20" width="24" height="24">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>`,
      error: `<svg fill="currentColor" viewBox="0 0 20 20" width="24" height="24">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>`,
      warning: `<svg fill="currentColor" viewBox="0 0 20 20" width="24" height="24">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>`,
      info: `<svg fill="currentColor" viewBox="0 0 20 20" width="24" height="24">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
            </svg>`,
    };
    return icons[type] || icons.info;
  }

  dismiss(toast) {
    toast.classList.remove("toast-show");
    toast.classList.add("toast-hide");

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  // Convenience methods
  success(message, duration = 3000) {
    return this.show(message, "success", duration);
  }

  error(message, duration = 4000) {
    return this.show(message, "error", duration);
  }

  warning(message, duration = 3500) {
    return this.show(message, "warning", duration);
  }

  info(message, duration = 3000) {
    return this.show(message, "info", duration);
  }

  // Loading toast with custom dismiss
  loading(message) {
    const toast = this.show(message, "info", 0);
    toast.classList.add("toast-loading");

    // Add spinner
    const spinner = document.createElement("div");
    spinner.className = "toast-spinner";
    spinner.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round"/>
        </svg>`;
    toast
      .querySelector(".toast-content")
      .insertBefore(spinner, toast.querySelector(".toast-icon"));

    return {
      dismiss: () => this.dismiss(toast),
      update: (newMessage, type = "success") => {
        this.dismiss(toast);
        return this.show(newMessage, type);
      },
    };
  }

  // Promise wrapper for async operations
  async promise(promise, messages = {}) {
    const defaultMessages = {
      loading: "Loading...",
      success: "Success!",
      error: "An error occurred",
    };

    const msgs = { ...defaultMessages, ...messages };
    const loadingToast = this.loading(msgs.loading);

    try {
      const result = await promise;
      loadingToast.update(msgs.success, "success");
      return result;
    } catch (error) {
      const errorMsg = msgs.error || error.message || "An error occurred";
      loadingToast.update(errorMsg, "error");
      throw error;
    }
  }

  // Clear all toasts
  clearAll() {
    const toasts = this.container.querySelectorAll(".toast");
    toasts.forEach((toast) => this.dismiss(toast));
  }
}

// Create global instance
const toast = new Toast();

// Export for module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = toast;
}
