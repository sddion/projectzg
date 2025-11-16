document.addEventListener("DOMContentLoaded", () => {
  const emailInputGroup = document.getElementById("email-input-group");
  const emailInput = document.getElementById("email");
  const sendResetEmailBtn = document.getElementById("send-reset-email-btn");
  const otpGroup = document.getElementById("otp-group");
  const newPasswordGroup = document.getElementById("new-password-group");
  const changePasswordBtn = document.getElementById("change-password-btn");
  const headerTitle = document.querySelector(".header-title");

  // Function to parse URL hash for tokens
  function parseHash() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    return params;
  }

  // Function to parse URL query parameters
  function parseQueryParams() {
    const query = window.location.search.substring(1);
    const params = new URLSearchParams(query);
    return params;
  }

  const hashParams = parseHash();
  const queryParams = parseQueryParams();

  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");
  const type = hashParams.get("type");
  const mode = queryParams.get("mode");

  // Default state: hide all
  emailInputGroup.style.display = "none";
  sendResetEmailBtn.style.display = "none";
  otpGroup.style.display = "none";
  newPasswordGroup.style.display = "none";
  changePasswordBtn.style.display = "none";

  if (accessToken && type === "recovery") {
    // Scenario 1: User has come from a password reset link (from email)
    headerTitle.textContent = "Set New Password";
    newPasswordGroup.style.display = "block";
    changePasswordBtn.style.display = "block";
    supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  } else if (mode === "forgot") {
    // Scenario 2: User clicked "Forgot Password" link
    headerTitle.textContent = "Forgot Password";
    emailInputGroup.style.display = "block";
    sendResetEmailBtn.style.display = "block";
  } else {
    // Scenario 3: Direct access without recovery token or forgot mode (e.g., logged-in user changing password)
    // For now, I'll just show the email input and send reset email button,
    // Imagine a logged-in user would also initiate a reset via email.
    // A more robust solution might involve checking for an active session here
    // and showing current password fields if logged in.
    headerTitle.textContent = "Change Password";
    emailInputGroup.style.display = "block";
    sendResetEmailBtn.style.display = "block";
  }

  sendResetEmailBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();

    // Validate email using LoginSchema (email validation is the same)
    const validation = LoginSchema.validate({
      email: email,
      password: "placeholder", // Required for schema but not used for email reset
    });

    if (!validation.valid) {
      const firstError = getFirstError(validation.errors);
      toast?.error?.(firstError) || alert(firstError);
      return;
    }

    try {
      const response = await apiRequest("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      const result = await response.json();

      if (response.ok) {
        toast?.success?.(
          "A password reset link has been sent to your email."
        ) || alert("A password reset link has been sent to your email.");
        // The user will need to click the link in their email to proceed.
        // The page will then reload with the recovery token in the URL.
      } else {
        toast?.error?.("Error sending password reset email: " + result.error) ||
          alert("Error sending password reset email: " + result.error);
      }
    } catch (error) {
      console.error("Error sending password reset email:", error);
      toast?.error?.("An error occurred. Please try again.") ||
        alert("An error occurred. Please try again.");
    }
  });

  changePasswordBtn.addEventListener("click", async () => {
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword =
      document.getElementById("confirm-password")?.value || newPassword;

    // Validate new passwords using ChangePasswordSchema
    const validation = ChangePasswordSchema.validate({
      current_password: "placeholder", // Not needed for recovery flow
      new_password: newPassword,
      confirm_password: confirmPassword,
    });

    if (!validation.valid) {
      const errors = formatValidationErrors(validation.errors);
      toast?.error?.(errors) || alert(errors);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast?.error?.("Error changing password: " + error.message) ||
          alert("Error changing password: " + error.message);
      } else {
        toast?.success?.(
          "Password changed successfully! You can now log in with your new password."
        ) ||
          alert(
            "Password changed successfully! You can now log in with your new password."
          );
        // Redirect to login page
        window.location.href = "/login.html";
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast?.error?.("An error occurred. Please try again.") ||
        alert("An error occurred. Please try again.");
    }
  });
});
