document.addEventListener("DOMContentLoaded", async () => {
  // Get form elements
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const loginBtn = document.getElementById("login-btn");
  const googleLoginBtn = document.getElementById("google-login-btn");
  const errorContainer = document.getElementById("error-container");
  const formContainer =
    document.querySelector("form") || document.querySelector(".login-form");

  // Track form state
  let isLoading = false;

  /**
   * Display validation errors
   */
  function displayErrors(errors) {
    if (!errorContainer) return;

    // Clear previous errors
    errorContainer.innerHTML = "";
    errorContainer.style.display = "none";

    // Clear input error states
    [emailInput, passwordInput].forEach((input) => {
      if (input) input.classList.remove("input-error");
    });

    if (Object.keys(errors).length === 0) return;

    // Display errors
    const errorList = document.createElement("div");
    errorList.className = "error-message";

    Object.entries(errors).forEach(([field, message]) => {
      // Add error class to input
      const input = document.getElementById(field);
      if (input) input.classList.add("input-error");

      // Add error message
      const errorItem = document.createElement("p");
      errorItem.textContent = message;
      errorList.appendChild(errorItem);
    });

    errorContainer.appendChild(errorList);
    errorContainer.style.display = "block";
  }

  /**
   * Validate login form
   */
  function validateLoginForm() {
    const formData = {
      email: emailInput?.value?.trim() || "",
      password: passwordInput?.value || "",
    };

    return LoginSchema.validate(formData);
  }

  /**
   * Handle profile redirection after login
   */
  async function handlePostLoginRedirect(userId) {
    try {
      const response = await apiRequest(`/profile/${userId}`);

      if (response.ok) {
        // Profile exists, go to home
        window.location.href = "/home.html";
      } else if (response.status === 404) {
        // No profile, need to complete profile
        window.location.href = "/complete-profile.html";
      } else {
        console.error("Error checking profile");
        window.location.href = "/home.html";
      }
    } catch (error) {
      console.error("Error handling post-login redirect:", error);
      window.location.href = "/home.html";
    }
  }

  /**
   * Handle OAuth callback
   */
  async function handleOAuthCallback() {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");

    if (!accessToken) return;

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (session) {
        localStorage.setItem("supabaseSession", JSON.stringify(session));
        await handlePostLoginRedirect(session.user.id);
      } else if (error) {
        console.error("OAuth error:", error);
        displayErrors({ general: error.message });
      }
    } catch (error) {
      console.error("Error handling OAuth callback:", error);
      displayErrors({ general: error.message });
    }
  }

  /**
   * Handle login
   */
  async function handleLogin() {
    if (isLoading) return;

    // Validate form
    const validation = validateLoginForm();
    displayErrors(validation.errors);

    if (!validation.valid) {
      toast?.error?.("Please fix the errors above") ||
        alert("Please fix the errors above");
      return;
    }

    isLoading = true;
    setFormDisabled(formContainer, true);

    try {
      const response = await apiRequest("/auth/signin", {
        method: "POST",
        body: JSON.stringify({
          email: emailInput.value.trim(),
          password: passwordInput.value,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store session data
        localStorage.setItem("supabaseSession", JSON.stringify(data.session));
        toast?.success?.("Login successful!") || alert("Login successful!");

        // Clear form and errors
        if (formContainer) formContainer.reset();
        displayErrors({});

        // Handle redirect
        await handlePostLoginRedirect(data.user.id);
      } else {
        const errorMsg = data.error || "Login failed";
        toast?.error?.(errorMsg) || alert(`Login failed: ${errorMsg}`);
        displayErrors({ general: errorMsg });
      }
    } catch (error) {
      console.error("Error logging in:", error);
      const errorMsg = error.message || "An error occurred. Please try again.";
      toast?.error?.(errorMsg) || alert(errorMsg);
      displayErrors({ general: errorMsg });
    } finally {
      isLoading = false;
      setFormDisabled(formContainer, false);
    }
  }

  /**
   * Handle Google login
   */
  async function handleGoogleLogin() {
    if (isLoading) return;

    isLoading = true;

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/login.html",
        },
      });

      if (error) {
        const errorMsg = `Error logging in with Google: ${error.message}`;
        toast?.error?.(errorMsg) || alert(errorMsg);
        displayErrors({ general: errorMsg });
      }
    } catch (error) {
      console.error("Error logging in with Google:", error);
      const errorMsg = error.message || "An error occurred. Please try again.";
      toast?.error?.(errorMsg) || alert(errorMsg);
      displayErrors({ general: errorMsg });
    } finally {
      isLoading = false;
    }
  }

  // Add event listeners
  if (loginBtn) {
    loginBtn.addEventListener("click", handleLogin);
  }

  if (googleLoginBtn) {
    googleLoginBtn.addEventListener("click", handleGoogleLogin);
  }

  // Allow Enter key to submit
  if (passwordInput) {
    passwordInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !isLoading) {
        handleLogin();
      }
    });
  }

  // Listen for auth state changes
  if (typeof supabase !== "undefined" && supabase.auth) {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        localStorage.setItem("supabaseSession", JSON.stringify(session));
        await handlePostLoginRedirect(session.user.id);
      }
    });
  }

  // Check for OAuth callback
  handleOAuthCallback();
});
