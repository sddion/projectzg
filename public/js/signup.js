document.addEventListener("DOMContentLoaded", async () => {
  // Get form elements
  const displayNameInput = document.getElementById('display-name');
  const usernameInput = document.getElementById('username');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const signupBtn = document.getElementById('signup-btn');
  const googleSignupBtn = document.getElementById('google-signup-btn');
  const errorContainer = document.getElementById('error-container');
  const formContainer = document.querySelector('form') || document.querySelector('.signup-form');

  // Track form state
  let isLoading = false;

  /**
   * Display validation errors
   */
  function displayErrors(errors) {
    if (!errorContainer) return;

    // Clear previous errors
    errorContainer.innerHTML = '';
    errorContainer.style.display = 'none';

    // Clear input error states
    [displayNameInput, usernameInput, emailInput, passwordInput, confirmPasswordInput]
      .forEach(input => {
        if (input) input.classList.remove('input-error');
      });

    if (Object.keys(errors).length === 0) return;

    // Display errors
    const errorList = document.createElement('div');
    errorList.className = 'error-message';

    Object.entries(errors).forEach(([field, message]) => {
      // Add error class to input
      const input = document.getElementById(field);
      if (input) input.classList.add('input-error');

      // Add error message
      const errorItem = document.createElement('p');
      errorItem.textContent = message;
      errorList.appendChild(errorItem);
    });

    errorContainer.appendChild(errorList);
    errorContainer.style.display = 'block';
  }

  /**
   * Validate signup form
   */
  function validateSignupForm() {
    const formData = {
      display_name: displayNameInput?.value?.trim() || '',
      username: usernameInput?.value?.trim() || '',
      email: emailInput?.value?.trim() || '',
      password: passwordInput?.value || '',
      confirm_password: confirmPasswordInput?.value || '',
    };

    // Validate using schema
    const validation = SignupSchema.validate(formData);

    // Check password confirmation
    if (validation.valid && formData.password !== formData.confirm_password) {
      validation.valid = false;
      validation.errors.confirm_password = 'Passwords do not match';
    }

    return validation;
  }

  /**
   * Handle signup
   */
  async function handleSignup() {
    if (isLoading) return;

    // Validate form
    const validation = validateSignupForm();
    displayErrors(validation.errors);

    if (!validation.valid) {
      toast?.error?.('Please fix the errors above') || alert('Please fix the errors above');
      return;
    }

    isLoading = true;
    setFormDisabled(formContainer, true);

    try {
      const response = await apiRequest('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          display_name: displayNameInput.value.trim(),
          username: usernameInput.value.trim(),
          email: emailInput.value.trim(),
          password: passwordInput.value,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast?.success?.('Signup successful! Please check your email to confirm your account.')
          || alert('Signup successful! Please check your email to confirm your account.');

        // Clear form
        if (formContainer) formContainer.reset();
        displayErrors({});

        // Redirect to login after delay
        setTimeout(() => {
          window.location.href = '/login.html';
        }, 2000);
      } else {
        const errorMsg = data.error || 'Signup failed';
        toast?.error?.(errorMsg) || alert(`Signup failed: ${errorMsg}`);
        displayErrors({ general: errorMsg });
      }
    } catch (error) {
      console.error('Error signing up:', error);
      const errorMsg = error.message || 'An error occurred. Please try again.';
      toast?.error?.(errorMsg) || alert(errorMsg);
      displayErrors({ general: errorMsg });
    } finally {
      isLoading = false;
      setFormDisabled(formContainer, false);
    }
  }

  /**
   * Handle Google signup
   * Redirect to login page after Google auth completes
   * Login page will handle checking profile status
   */
  async function handleGoogleSignup() {
    if (isLoading) return;

    isLoading = true;

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + "/login.html",
        },
      });

      if (error) {
        const errorMsg = `Error signing up with Google: ${error.message}`;
        toast?.error?.(errorMsg) || alert(errorMsg);
        displayErrors({ general: errorMsg });
      }
    } catch (error) {
      console.error("Error signing up with Google:", error);
      const errorMsg = error.message || "An error occurred. Please try again.";
      toast?.error?.(errorMsg) || alert(errorMsg);
      displayErrors({ general: errorMsg });
    } finally {
      isLoading = false;
    }
  }

  // Add event listeners
  if (signupBtn) {
    signupBtn.addEventListener('click', handleSignup);
  }

  if (googleSignupBtn) {
    googleSignupBtn.addEventListener('click', handleGoogleSignup);
  }

  // Optional: Add Enter key support
  if (formContainer) {
    formContainer.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !isLoading) {
        handleSignup();
      }
    });
  }
});