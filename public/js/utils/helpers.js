/**
 * Utility Helpers
 * Common utilities for API calls, error handling, and form management
 */

// ============ API Request Helper ============

/**
 * Enhanced API request wrapper with error handling
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>}
 */
async function apiRequest(endpoint, options = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // Add session token if available
  try {
    const session = JSON.parse(localStorage.getItem('supabaseSession'));
    if (session && session.access_token) {
      defaultHeaders['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch (e) {
    // Session not available or invalid JSON
  }

  const config = {
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(endpoint, config);

    // Handle 401 - redirect to login
    if (response.status === 401) {
      localStorage.removeItem('supabaseSession');
      window.location.href = '/login.html';
    }

    return response;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// ============ Error Handling ============

/**
 * Handle API errors and extract meaningful messages
 * @param {Response | Error} error - Response or Error object
 * @returns {Object} Formatted error object
 */
async function handleApiError(error) {
  if (error instanceof Response) {
    const data = await error.json().catch(() => ({}));
    return {
      status: error.status,
      message: data.error || data.message || 'An error occurred',
      details: data.details || {},
    };
  }

  return {
    status: null,
    message: error.message || 'An unexpected error occurred',
    details: {},
  };
}

/**
 * Retry failed API calls with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @returns {Promise}
 */
async function retryWithBackoff(fn, options = {}) {
  const maxRetries = options.maxRetries || 3;
  const delay = options.delay || 1000;
  const backoffMultiplier = options.backoffMultiplier || 2;

  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on 4xx errors (client errors)
      if (error.status && error.status >= 400 && error.status < 500) {
        throw error;
      }

      if (i < maxRetries - 1) {
        const waitTime = delay * Math.pow(backoffMultiplier, i);
        console.log(`Retrying after ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
}

// ============ Form Helpers ============

/**
 * Get form values as object
 * @param {HTMLFormElement | string} form - Form element or ID
 * @returns {Object} Form values
 */
function getFormValues(form) {
  const formElement = typeof form === 'string'
    ? document.getElementById(form)
    : form;

  if (!formElement) return {};

  const formData = new FormData(formElement);
  const values = {};

  for (const [key, value] of formData.entries()) {
    if (values[key]) {
      // Handle multiple values with same name
      if (Array.isArray(values[key])) {
        values[key].push(value);
      } else {
        values[key] = [values[key], value];
      }
    } else {
      values[key] = value;
    }
  }

  return values;
}

/**
 * Set form values
 * @param {HTMLFormElement | string} form - Form element or ID
 * @param {Object} values - Form values to set
 */
function setFormValues(form, values) {
  const formElement = typeof form === 'string'
    ? document.getElementById(form)
    : form;

  if (!formElement) return;

  Object.entries(values).forEach(([key, value]) => {
    const field = formElement.elements[key];
    if (field) {
      if (field.type === 'checkbox') {
        field.checked = value;
      } else if (field.type === 'radio') {
        formElement.elements[key].forEach(radio => {
          radio.checked = radio.value === value;
        });
      } else {
        field.value = value;
      }
    }
  });
}

/**
 * Clear form values
 * @param {HTMLFormElement | string} form - Form element or ID
 */
function clearForm(form) {
  const formElement = typeof form === 'string'
    ? document.getElementById(form)
    : form;

  if (formElement) {
    formElement.reset();
  }
}

/**
 * Disable all form inputs
 * @param {HTMLFormElement | string} form - Form element or ID
 * @param {boolean} disabled - Disabled state
 */
function setFormDisabled(form, disabled) {
  const formElement = typeof form === 'string'
    ? document.getElementById(form)
    : form;

  if (!formElement) return;

  Array.from(formElement.elements).forEach(element => {
    element.disabled = disabled;
  });
}

// ============ DOM Helpers ============

/**
 * Show/hide element
 * @param {HTMLElement | string} element - Element or selector
 * @param {boolean} show - Show or hide
 */
function toggleElement(element, show) {
  const el = typeof element === 'string'
    ? document.querySelector(element)
    : element;

  if (el) {
    el.style.display = show ? '' : 'none';
  }
}

/**
 * Add/remove CSS class
 * @param {HTMLElement | string} element - Element or selector
 * @param {string} className - Class name
 * @param {boolean} add - Add or remove
 */
function toggleClass(element, className, add) {
  const el = typeof element === 'string'
    ? document.querySelector(element)
    : element;

  if (el) {
    if (add) {
      el.classList.add(className);
    } else {
      el.classList.remove(className);
    }
  }
}

/**
 * Clear element content
 * @param {HTMLElement | string} element - Element or selector
 */
function clearElement(element) {
  const el = typeof element === 'string'
    ? document.querySelector(element)
    : element;

  if (el) {
    el.innerHTML = '';
  }
}

// ============ Debounce and Throttle ============

/**
 * Debounce function
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(fn, delay = 300) {
  let timeoutId;

  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Throttle function
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(fn, limit = 300) {
  let inThrottle;

  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

// ============ Data Formatting ============

/**
 * Format date to readable string
 * @param {string | Date} date - Date to format
 * @returns {string} Formatted date
 */
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format time ago
 * @param {string | Date} date - Date to format
 * @returns {string} Time ago string
 */
function timeAgo(date) {
  if (!date) return '';

  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  } else if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}m ago`;
  } else if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}h ago`;
  } else if (diffInSeconds < 2592000) {
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  } else {
    return formatDate(date);
  }
}

/**
 * Format number with abbreviation
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// ============ Validation Helpers ============

/**
 * Check if email is valid
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Check if URL is valid
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ============ Export ============

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    apiRequest,
    handleApiError,
    retryWithBackoff,
    getFormValues,
    setFormValues,
    clearForm,
    setFormDisabled,
    toggleElement,
    toggleClass,
    clearElement,
    debounce,
    throttle,
    formatDate,
    timeAgo,
    formatNumber,
    isValidEmail,
    isValidUrl,
  };
}
