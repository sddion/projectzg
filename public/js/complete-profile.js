document.addEventListener("DOMContentLoaded", async () => {
  const displayNameInput = document.getElementById("display-name");
  const usernameInput = document.getElementById("username");
  const bioInput = document.getElementById("bio");
  const genderInput = document.getElementById("gender");
  const completeProfileBtn = document.getElementById("complete-profile-btn");
  const usernameFeedback = document.getElementById("username-feedback");

  let currentSession = null;
  let isChecking = false;

  // Wait for apiRequest to be available
  const waitForApi = () => {
    return new Promise((resolve) => {
      if (typeof apiRequest !== "undefined") {
        resolve();
      } else {
        const interval = setInterval(() => {
          if (typeof apiRequest !== "undefined") {
            clearInterval(interval);
            resolve();
          }
        }, 100);
      }
    });
  };

  await waitForApi();

  // Check if user is authenticated
  try {
    const session = localStorage.getItem("supabaseSession");
    if (!session) {
      alert("Please sign in first");
      window.location.href = "/login.html";
      return;
    }

    currentSession = JSON.parse(session);

    // Check if user already has a community profile
    try {
      const response = await apiRequest(`/profile/${currentSession.user.id}`);
      if (response.ok) {
        // Profile already exists, user shouldn't be on this page
        console.log("[PROFILE] User already has profile, redirecting to home");
        window.location.href = "/home.html";
        return;
      }
      // 404 is expected (no profile yet), continue to profile creation form
    } catch (error) {
      console.error("Error checking existing profile:", error);
      // If we can't check, assume no profile and let them continue
    }

    // Pre-fill display name from OAuth account metadata if available
    if (currentSession.user?.user_metadata?.full_name) {
      displayNameInput.value = currentSession.user.user_metadata.full_name;
    } else if (currentSession.user?.user_metadata?.name) {
      displayNameInput.value = currentSession.user.user_metadata.name;
    } else if (currentSession.user?.email) {
      displayNameInput.value = currentSession.user.email.split("@")[0];
    }

    // Suggest a username based on email
    if (currentSession.user?.email) {
      const suggestedUsername = currentSession.user.email
        .split("@")[0]
        .replace(/[^a-zA-Z0-9_]/g, "")
        .toLowerCase();
      usernameInput.placeholder = suggestedUsername;
    }
  } catch (error) {
    console.error("Error checking authentication:", error);
    alert("Session error. Please sign in again.");
    window.location.href = "/login.html";
    return;
  }

  // Username validation
  let usernameCheckTimeout;
  usernameInput.addEventListener("input", () => {
    clearTimeout(usernameCheckTimeout);
    const username = usernameInput.value.trim();

    // Clear feedback
    usernameFeedback.textContent = "";
    usernameFeedback.style.color = "";

    if (username.length === 0) {
      return;
    }

    // Validate format
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      usernameFeedback.textContent =
        " Only letters, numbers, and underscores allowed";
      usernameFeedback.style.color = "#e74c3c";
      return;
    }

    if (username.length < 3) {
      usernameFeedback.textContent =
        " Username must be at least 3 characters";
      usernameFeedback.style.color = "#e74c3c";
      return;
    }

    // Check availability (debounced)
    usernameFeedback.textContent = "Checking availability...";
    usernameFeedback.style.color = "#666";

    usernameCheckTimeout = setTimeout(async () => {
      if (isChecking) return;
      isChecking = true;

      try {
        const response = await apiRequest(`/search?q=${username}`);
        if (response.ok) {
          const results = await response.json();
          const exactMatch = results.find(
            (user) => user.username.toLowerCase() === username.toLowerCase()
          );

          if (exactMatch) {
            usernameFeedback.textContent = "Username is already taken";
            usernameFeedback.style.color = "#e74c3c";
          } else {
            usernameFeedback.textContent = "Username is available!";
            usernameFeedback.style.color = "#27ae60";
          }
        }
      } catch (error) {
        console.error("Error checking username:", error);
        usernameFeedback.textContent = "Could not verify availability";
        usernameFeedback.style.color = "#f39c12";
      } finally {
        isChecking = false;
      }
    }, 500);
  });

  completeProfileBtn.addEventListener("click", async () => {
    const displayName = displayNameInput.value.trim();
    const username = usernameInput.value.trim();
    const bio = bioInput.value.trim();
    const gender = genderInput.value;

    // Validation
    if (!displayName || !username) {
      alert("Please fill in display name and username");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      alert("Username can only contain letters, numbers, and underscores");
      return;
    }

    if (username.length < 3 || username.length > 20) {
      alert("Username must be between 3 and 20 characters");
      return;
    }

    // Check if feedback shows error
    if (usernameFeedback.textContent.includes("❌")) {
      alert("Please choose a valid and available username");
      return;
    }

    completeProfileBtn.disabled = true;
    completeProfileBtn.textContent = "Creating Profile...";

    try {
      const profileData = {
        username: username,
        display_name: displayName,
        bio: bio || null,
        gender: gender || null,
        avatar_url:
          currentSession.user?.user_metadata?.avatar_url ||
          currentSession.user?.user_metadata?.picture ||
          null,
      };

      console.log("Creating profile with data:", profileData);

      const response = await apiRequest("/profile/create", {
        method: "POST",
        body: JSON.stringify(profileData),
      });

      console.log("Response status:", response.status);

      if (response.ok) {
        try {
          const data = await response.json();
          console.log("Profile created successfully:", data);
          alert("Profile created successfully! Welcome to ProjectZG!");
          window.location.href = "/home.html";
        } catch (jsonError) {
          console.error("JSON parse error:", jsonError);
          // Profile might be created, try redirecting anyway
          alert("Profile created! Redirecting...");
          window.location.href = "/home.html";
        }
      } else {
        // Handle error response
        let errorMessage = "Failed to create profile";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error("Error creating profile:", errorData);
        } catch (jsonError) {
          // Can't parse error as JSON, try as text
          try {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
            console.error("Error response:", errorText);
          } catch (textError) {
            console.error("Could not read error response");
          }
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error creating profile:", error);
      alert(
        "Failed to create profile: " +
          (error.message || "Unknown error. Please try again.")
      );
      completeProfileBtn.disabled = false;
      completeProfileBtn.textContent = "Complete Profile";
    }
  });

  // Allow Enter key to submit
  usernameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      completeProfileBtn.click();
    }
  });
});