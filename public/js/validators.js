/**
 * Zod Validation Schemas
 * Centralized validation for all user inputs across the application
 * Using Zod from CDN for consistent validation across all forms
 */

// Wait for Zod to be available globally (loaded from CDN)
const getZod = () => {
  if (typeof z !== "undefined") {
    return z;
  }
  throw new Error(
    "Zod library not loaded. Make sure to include Zod CDN script."
  );
};

// ============ Auth Validators ============

/**
 * Signup validation schema
 * Validates: display_name, username, email, password, confirm_password
 */
let SignupSchema = {
  // Zod schema definition
  zodSchema: null,

  /**
   * Initialize Zod schema once Zod is loaded
   */
  getZodSchema: function () {
    if (!this.zodSchema && typeof z !== "undefined") {
      this.zodSchema = z
        .object({
          display_name: z
            .string()
            .min(2, "Display name must be at least 2 characters")
            .max(100, "Display name must be less than 100 characters"),
          username: z
            .string()
            .min(3, "Username must be at least 3 characters")
            .max(30, "Username must be less than 30 characters")
            .regex(
              /^[a-zA-Z0-9_-]+$/,
              "Username can only contain letters, numbers, underscores, and hyphens"
            ),
          email: z.string().email("Invalid email format"),
          password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(
              /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
              "Password must contain uppercase, lowercase, and numbers"
            ),
          confirm_password: z.string().min(1, "Please confirm your password"),
        })
        .refine((data) => data.password === data.confirm_password, {
          message: "Passwords do not match",
          path: ["confirm_password"],
        });
    }
    return this.zodSchema;
  },

  /**
   * Validate signup data using Zod
   */
  validate: function (data) {
    try {
      const schema = this.getZodSchema();
      if (!schema) {
        // Fallback to manual validation if Zod not loaded
        return this.validateManual(data);
      }

      const result = schema.safeParse(data);

      if (result.success) {
        return {
          valid: true,
          errors: {},
          data: result.data,
        };
      } else {
        const errors = {};
        result.error.errors.forEach((err) => {
          const path = err.path.join(".");
          errors[path] = err.message;
        });

        return {
          valid: false,
          errors,
          data: null,
        };
      }
    } catch (error) {
      // Fallback to manual validation if Zod throws
      return this.validateManual(data);
    }
  },

  /**
   * Fallback manual validation (if Zod not loaded)
   */
  validateManual: function (data) {
    const errors = {};

    // Display name validation
    if (!data.display_name || typeof data.display_name !== "string") {
      errors.display_name = "Display name is required";
    } else if (data.display_name.trim().length < 2) {
      errors.display_name = "Display name must be at least 2 characters";
    } else if (data.display_name.length > 100) {
      errors.display_name = "Display name must be less than 100 characters";
    }

    // Username validation
    if (!data.username || typeof data.username !== "string") {
      errors.username = "Username is required";
    } else if (data.username.trim().length < 3) {
      errors.username = "Username must be at least 3 characters";
    } else if (data.username.length > 30) {
      errors.username = "Username must be less than 30 characters";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(data.username)) {
      errors.username =
        "Username can only contain letters, numbers, underscores, and hyphens";
    }

    // Email validation
    if (!data.email || typeof data.email !== "string") {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = "Invalid email format";
    }

    // Password validation
    if (!data.password || typeof data.password !== "string") {
      errors.password = "Password is required";
    } else if (data.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.password)) {
      errors.password =
        "Password must contain uppercase, lowercase, and numbers";
    }

    // Confirm password validation
    if (!data.confirm_password) {
      errors.confirm_password = "Please confirm your password";
    } else if (data.password !== data.confirm_password) {
      errors.confirm_password = "Passwords do not match";
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
      data: Object.keys(errors).length === 0 ? data : null,
    };
  },
};

/**
 * Login validation schema
 * Validates: email, password
 */
let LoginSchema = {
  zodSchema: null,

  getZodSchema: function () {
    if (!this.zodSchema && typeof z !== "undefined") {
      this.zodSchema = z.object({
        email: z.string().email("Invalid email format"),
        password: z.string().min(1, "Password is required"),
      });
    }
    return this.zodSchema;
  },

  validate: function (data) {
    try {
      const schema = this.getZodSchema();
      if (!schema) {
        return this.validateManual(data);
      }

      const result = schema.safeParse(data);

      if (result.success) {
        return {
          valid: true,
          errors: {},
          data: result.data,
        };
      } else {
        const errors = {};
        result.error.errors.forEach((err) => {
          const path = err.path.join(".");
          errors[path] = err.message;
        });

        return {
          valid: false,
          errors,
          data: null,
        };
      }
    } catch (error) {
      // Fallback to manual validation if Zod throws
      return this.validateManual(data);
    }
  },

  validateManual: function (data) {
    const errors = {};

    // Email validation
    if (!data.email || typeof data.email !== "string") {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = "Invalid email format";
    }

    // Password validation
    if (!data.password || typeof data.password !== "string") {
      errors.password = "Password is required";
    } else if (data.password.length === 0) {
      errors.password = "Password cannot be empty";
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
      data: Object.keys(errors).length === 0 ? data : null,
    };
  },
};

/**
 * Change password validation schema
 * Validates: current_password, new_password, confirm_password
 */
let ChangePasswordSchema = {
  zodSchema: null,

  getZodSchema: function () {
    if (!this.zodSchema && typeof z !== "undefined") {
      this.zodSchema = z
        .object({
          current_password: z.string().min(1, "Current password is required"),
          new_password: z
            .string()
            .min(8, "New password must be at least 8 characters")
            .regex(
              /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
              "Password must contain uppercase, lowercase, and numbers"
            ),
          confirm_password: z.string().min(1, "Please confirm your password"),
        })
        .refine((data) => data.current_password !== data.new_password, {
          message: "New password must be different from current password",
          path: ["new_password"],
        })
        .refine((data) => data.new_password === data.confirm_password, {
          message: "Passwords do not match",
          path: ["confirm_password"],
        });
    }
    return this.zodSchema;
  },

  validate: function (data) {
    try {
      const schema = this.getZodSchema();
      if (!schema) {
        return this.validateManual(data);
      }

      const result = schema.safeParse(data);

      if (result.success) {
        return {
          valid: true,
          errors: {},
          data: result.data,
        };
      } else {
        const errors = {};
        result.error.errors.forEach((err) => {
          const path = err.path.join(".");
          errors[path] = err.message;
        });

        return {
          valid: false,
          errors,
          data: null,
        };
      }
    } catch (error) {
      // Fallback to manual validation if Zod throws
      return this.validateManual(data);
    }
  },

  validateManual: function (data) {
    const errors = {};

    // Current password validation
    if (!data.current_password || typeof data.current_password !== "string") {
      errors.current_password = "Current password is required";
    } else if (data.current_password.length === 0) {
      errors.current_password = "Current password cannot be empty";
    }

    // New password validation
    if (!data.new_password || typeof data.new_password !== "string") {
      errors.new_password = "New password is required";
    } else if (data.new_password.length < 8) {
      errors.new_password = "New password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.new_password)) {
      errors.new_password =
        "Password must contain uppercase, lowercase, and numbers";
    }

    // Confirm password validation
    if (!data.confirm_password) {
      errors.confirm_password = "Confirm password is required";
    } else if (data.new_password !== data.confirm_password) {
      errors.confirm_password = "Passwords do not match";
    }

    // Check if new password is different from current
    if (data.current_password === data.new_password) {
      errors.new_password =
        "New password must be different from current password";
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
      data: Object.keys(errors).length === 0 ? data : null,
    };
  },
};

// ============ Profile Validators ============

/**
 * Edit profile validation schema
 * Validates: display_name, bio, location, website, avatar_url
 */
let EditProfileSchema = {
  zodSchema: null,

  getZodSchema: function () {
    if (!this.zodSchema && typeof z !== "undefined") {
      this.zodSchema = z.object({
        display_name: z
          .string()
          .min(2, "Display name must be at least 2 characters")
          .max(100, "Display name must be less than 100 characters")
          .optional(),
        bio: z
          .string()
          .max(500, "Bio must be less than 500 characters")
          .optional(),
        location: z
          .string()
          .max(100, "Location must be less than 100 characters")
          .optional(),
        website: z
          .string()
          .url("Invalid URL format")
          .optional()
          .or(z.literal("")),
      });
    }
    return this.zodSchema;
  },

  validate: function (data) {
    try {
      const schema = this.getZodSchema();
      if (!schema) {
        return this.validateManual(data);
      }

      const result = schema.safeParse(data);

      if (result.success) {
        return {
          valid: true,
          errors: {},
          data: result.data,
        };
      } else {
        const errors = {};
        result.error.errors.forEach((err) => {
          const path = err.path.join(".");
          errors[path] = err.message;
        });

        return {
          valid: false,
          errors,
          data: null,
        };
      }
    } catch (error) {
      // Fallback to manual validation if Zod throws
      return this.validateManual(data);
    }
  },

  validateManual: function (data) {
    const errors = {};

    // Display name validation
    if (data.display_name !== undefined) {
      if (typeof data.display_name !== "string") {
        errors.display_name = "Display name must be a string";
      } else if (data.display_name.trim().length < 2) {
        errors.display_name = "Display name must be at least 2 characters";
      } else if (data.display_name.length > 100) {
        errors.display_name = "Display name must be less than 100 characters";
      }
    }

    // Bio validation
    if (data.bio !== undefined) {
      if (typeof data.bio !== "string") {
        errors.bio = "Bio must be a string";
      } else if (data.bio.length > 500) {
        errors.bio = "Bio must be less than 500 characters";
      }
    }

    // Location validation
    if (data.location !== undefined) {
      if (typeof data.location !== "string") {
        errors.location = "Location must be a string";
      } else if (data.location.length > 100) {
        errors.location = "Location must be less than 100 characters";
      }
    }

    // Website validation
    if (data.website !== undefined && data.website) {
      if (typeof data.website !== "string") {
        errors.website = "Website must be a string";
      } else {
        try {
          new URL(data.website);
        } catch {
          errors.website = "Invalid URL format";
        }
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
      data: Object.keys(errors).length === 0 ? data : null,
    };
  },
};

// ============ Post Validators ============

/**
 * Create/edit post validation schema
 * Validates: content, image_url
 */
let PostSchema = {
  zodSchema: null,

  getZodSchema: function () {
    if (!this.zodSchema && typeof z !== "undefined") {
      this.zodSchema = z.object({
        content: z
          .string()
          .min(1, "Post content is required")
          .max(5000, "Post content must be less than 5000 characters"),
        image_url: z
          .string()
          .url("Invalid image URL format")
          .optional()
          .or(z.literal("")),
      });
    }
    return this.zodSchema;
  },

  validate: function (data) {
    try {
      const schema = this.getZodSchema();
      if (!schema) {
        return this.validateManual(data);
      }

      const result = schema.safeParse(data);

      if (result.success) {
        return {
          valid: true,
          errors: {},
          data: result.data,
        };
      } else {
        const errors = {};
        result.error.errors.forEach((err) => {
          const path = err.path.join(".");
          errors[path] = err.message;
        });

        return {
          valid: false,
          errors,
          data: null,
        };
      }
    } catch (error) {
      // Fallback to manual validation if Zod throws
      return this.validateManual(data);
    }
  },

  validateManual: function (data) {
    const errors = {};

    // Content validation
    if (!data.content || typeof data.content !== "string") {
      errors.content = "Post content is required";
    } else if (data.content.trim().length === 0) {
      errors.content = "Post content cannot be empty";
    } else if (data.content.length > 5000) {
      errors.content = "Post content must be less than 5000 characters";
    }

    // Image URL validation (optional)
    if (data.image_url) {
      if (typeof data.image_url !== "string") {
        errors.image_url = "Image URL must be a string";
      } else {
        try {
          new URL(data.image_url);
        } catch {
          errors.image_url = "Invalid image URL format";
        }
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
      data: Object.keys(errors).length === 0 ? data : null,
    };
  },
};

// ============ Comment Validators ============

/**
 * Create comment validation schema
 * Validates: content
 */
let CommentSchema = {
  zodSchema: null,

  getZodSchema: function () {
    if (!this.zodSchema && typeof z !== "undefined") {
      this.zodSchema = z.object({
        content: z
          .string()
          .min(1, "Comment content is required")
          .max(1000, "Comment must be less than 1000 characters"),
      });
    }
    return this.zodSchema;
  },

  validate: function (data) {
    try {
      const schema = this.getZodSchema();
      if (!schema) {
        return this.validateManual(data);
      }

      const result = schema.safeParse(data);

      if (result.success) {
        return {
          valid: true,
          errors: {},
          data: result.data,
        };
      } else {
        const errors = {};
        result.error.errors.forEach((err) => {
          const path = err.path.join(".");
          errors[path] = err.message;
        });

        return {
          valid: false,
          errors,
          data: null,
        };
      }
    } catch (error) {
      // Fallback to manual validation if Zod throws
      return this.validateManual(data);
    }
  },

  validateManual: function (data) {
    const errors = {};

    // Content validation
    if (!data.content || typeof data.content !== "string") {
      errors.content = "Comment content is required";
    } else if (data.content.trim().length === 0) {
      errors.content = "Comment cannot be empty";
    } else if (data.content.length > 1000) {
      errors.content = "Comment must be less than 1000 characters";
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
      data: Object.keys(errors).length === 0 ? data : null,
    };
  },
};

// ============ Story Validators ============

/**
 * Create story validation schema
 * Validates: image_url, text (optional)
 */
let StorySchema = {
  zodSchema: null,

  getZodSchema: function () {
    if (!this.zodSchema && typeof z !== "undefined") {
      this.zodSchema = z.object({
        image_url: z.string().url("Invalid image URL format"),
        text: z
          .string()
          .max(500, "Story text must be less than 500 characters")
          .optional()
          .or(z.literal("")),
      });
    }
    return this.zodSchema;
  },

  validate: function (data) {
    try {
      const schema = this.getZodSchema();
      if (!schema) {
        return this.validateManual(data);
      }

      const result = schema.safeParse(data);

      if (result.success) {
        return {
          valid: true,
          errors: {},
          data: result.data,
        };
      } else {
        const errors = {};
        result.error.errors.forEach((err) => {
          const path = err.path.join(".");
          errors[path] = err.message;
        });

        return {
          valid: false,
          errors,
          data: null,
        };
      }
    } catch (error) {
      // Fallback to manual validation if Zod throws
      return this.validateManual(data);
    }
  },

  validateManual: function (data) {
    const errors = {};

    // Image URL validation (required)
    if (!data.image_url || typeof data.image_url !== "string") {
      errors.image_url = "Story image is required";
    } else {
      try {
        new URL(data.image_url);
      } catch {
        errors.image_url = "Invalid image URL format";
      }
    }

    // Text validation (optional)
    if (data.text && typeof data.text !== "string") {
      errors.text = "Story text must be a string";
    } else if (data.text && data.text.length > 500) {
      errors.text = "Story text must be less than 500 characters";
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
      data: Object.keys(errors).length === 0 ? data : null,
    };
  },
};

// ============ Search Validators ============

/**
 * Search validation schema
 * Validates: query
 */
let SearchSchema = {
  zodSchema: null,

  getZodSchema: function () {
    if (!this.zodSchema && typeof z !== "undefined") {
      this.zodSchema = z.object({
        query: z
          .string()
          .min(1, "Search query is required")
          .max(200, "Search query must be less than 200 characters"),
      });
    }
    return this.zodSchema;
  },

  validate: function (data) {
    try {
      const schema = this.getZodSchema();
      if (!schema) {
        return this.validateManual(data);
      }

      const result = schema.safeParse(data);

      if (result.success) {
        return {
          valid: true,
          errors: {},
          data: result.data,
        };
      } else {
        const errors = {};
        result.error.errors.forEach((err) => {
          const path = err.path.join(".");
          errors[path] = err.message;
        });

        return {
          valid: false,
          errors,
          data: null,
        };
      }
    } catch (error) {
      // Fallback to manual validation if Zod throws
      return this.validateManual(data);
    }
  },

  validateManual: function (data) {
    const errors = {};

    // Query validation
    if (!data.query || typeof data.query !== "string") {
      errors.query = "Search query is required";
    } else if (data.query.trim().length < 1) {
      errors.query = "Search query cannot be empty";
    } else if (data.query.length > 200) {
      errors.query = "Search query must be less than 200 characters";
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
      data: Object.keys(errors).length === 0 ? data : null,
    };
  },
};

// ============ Error Helper ============

/**
 * Format validation errors for UI display
 * @param {Object} errors - Errors object from validator
 * @returns {string} Formatted error message
 */
function formatValidationErrors(errors) {
  return Object.values(errors).join("\n");
}

/**
 * Get first validation error
 * @param {Object} errors - Errors object from validator
 * @returns {string} First error message
 */
function getFirstError(errors) {
  const errorKeys = Object.keys(errors);
  return errorKeys.length > 0 ? errors[errorKeys[0]] : "";
}

// Export validators
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    SignupSchema,
    LoginSchema,
    ChangePasswordSchema,
    EditProfileSchema,
    PostSchema,
    CommentSchema,
    StorySchema,
    SearchSchema,
    formatValidationErrors,
    getFirstError,
  };
}
