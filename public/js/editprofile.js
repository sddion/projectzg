document.addEventListener("DOMContentLoaded", async () => {
  // Load theme preference from localStorage
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
  } else if (savedTheme === "light") {
    document.body.classList.remove("dark-mode");
  } else if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    document.body.classList.add("dark-mode");
  }

  const profileUsernameInput = document.getElementById("profile-username");
  const profileDisplayNameInput = document.getElementById(
    "profile-display-name"
  );
  const profileBioInput = document.getElementById("profile-bio");
  const profileGenderInput = document.getElementById("profile-gender");
  const profileAvatar = document.getElementById("profile-avatar");
  const changeAvatarBtn = document.getElementById("change-avatar-btn");
  const avatarFileInput = document.getElementById("avatar-file-input");
  const uploadStatus = document.getElementById("upload-status");
  const bioCount = document.getElementById("bio-count");
  const saveBtn = document.getElementById("save-btn");

  let uploadedAvatarUrl = null;
  let currentProfile = null;

  // Wait for dependencies
  const waitForDependencies = () => {
    return new Promise((resolve) => {
      const check = () => {
        if (
          typeof apiRequest !== "undefined" &&
          typeof supabase !== "undefined"
        ) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  };

  await waitForDependencies();

  // Bio character count
  if (profileBioInput && bioCount) {
    profileBioInput.addEventListener("input", () => {
      bioCount.textContent = profileBioInput.value.length;
    });
  }

  // Fetch user profile
  async function fetchUserProfile() {
    const session = JSON.parse(localStorage.getItem("supabaseSession"));
    const userId = session ? session.user.id : null;

    if (!userId) {
      console.error("No user ID found. Please sign in.");
      window.location.href = "/login.html";
      return;
    }

    try {
      const response = await apiRequest(`/profile/${userId}`);
      const profile = await response.json();

      if (response.ok) {
        currentProfile = profile;

        // Set form values
        profileUsernameInput.value = profile.username || "";
        profileDisplayNameInput.value = profile.display_name || "";
        profileBioInput.value = profile.bio || "";
        profileGenderInput.value = profile.gender || "";

        // Update bio count
        if (bioCount) {
          bioCount.textContent = (profile.bio || "").length;
        }

        // Display current avatar
        if (profile.avatar_url && profileAvatar) {
          profileAvatar.innerHTML = `<img src="${profile.avatar_url}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        }
      } else {
        console.error("Failed to fetch profile:", profile.error);
        if (response.status === 401) {
          window.location.href = "/login.html";
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  }

  // Handle avatar change button click
  changeAvatarBtn.addEventListener("click", () => {
    avatarFileInput.click();
  });

  // Handle avatar file selection
  avatarFileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert("Image size must be less than 5MB");
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      profileAvatar.innerHTML = `<img src="${e.target.result}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
    };
    reader.readAsDataURL(file);

    // Upload to Supabase storage
    uploadStatus.textContent = "Uploading...";
    uploadStatus.style.color = "#666";
    changeAvatarBtn.style.pointerEvents = "none";

    try {
      const session = JSON.parse(localStorage.getItem("supabaseSession"));
      if (!session || !session.user) {
        throw new Error("Not authenticated");
      }

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${session.user.id}/avatar-${Date.now()}.${fileExt}`;

      // Upload file to profile-avatars bucket
      const { data, error } = await supabase.storage
        .from("profile-avatars")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("profile-avatars")
        .getPublicUrl(fileName);

      uploadedAvatarUrl = urlData.publicUrl;
      uploadStatus.textContent = "✓ Avatar uploaded successfully";
      uploadStatus.style.color = "#27ae60";

      console.log("Avatar uploaded:", uploadedAvatarUrl);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      uploadStatus.textContent = "✗ Upload failed";
      uploadStatus.style.color = "#e74c3c";
      alert("Failed to upload avatar: " + error.message);

      // Restore original avatar on error
      if (currentProfile && currentProfile.avatar_url) {
        profileAvatar.innerHTML = `<img src="${currentProfile.avatar_url}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
      } else {
        profileAvatar.innerHTML = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 48px; height: 48px">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>`;
      }
      uploadedAvatarUrl = null;
    } finally {
      changeAvatarBtn.style.pointerEvents = "auto";
    }
  });

  // Save profile
  async function saveProfile() {
    const session = JSON.parse(localStorage.getItem("supabaseSession"));
    const userId = session ? session.user.id : null;

    if (!userId) {
      console.error("No user ID found. Please sign in.");
      window.location.href = "/login.html";
      return;
    }

    const displayName = profileDisplayNameInput.value.trim();
    const bio = profileBioInput.value.trim();
    const gender = profileGenderInput.value;

    // Validate profile data using EditProfileSchema
    const validation = EditProfileSchema.validate({
      display_name: displayName,
      bio: bio,
      gender: gender,
    });

    if (!validation.valid) {
      const errors = formatValidationErrors(validation.errors);
      toast?.error?.(errors) || alert(errors);
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    try {
      const updateData = {
        display_name: displayName,
        bio: bio || null,
        gender: gender || null,
      };

      // Add avatar URL if uploaded
      if (uploadedAvatarUrl) {
        updateData.avatar_url = uploadedAvatarUrl;
      }

      const response = await apiRequest(`/profile/${userId}`, {
        method: "PUT",
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        console.log("Profile saved successfully");
        toast?.success?.("Profile updated successfully!") ||
          alert("Profile updated successfully!");
        window.location.href = "/profile.html";
      } else {
        const result = await response.json().catch(() => ({}));
        console.error("Failed to save profile:", result.error);
        toast?.error?.(
          "Failed to save profile: " + (result.error || "Unknown error")
        ) ||
          alert("Failed to save profile: " + (result.error || "Unknown error"));
        if (response.status === 401) {
          window.location.href = "/login.html";
        }
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast?.error?.("Error saving profile: " + error.message) ||
        alert("Error saving profile: " + error.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save";
    }
  }

  // Fetch profile data when the page loads
  await fetchUserProfile();

  // Attach event listener to the Save button
  if (saveBtn) {
    saveBtn.addEventListener("click", (event) => {
      event.preventDefault();
      saveProfile();
    });
  }
});
