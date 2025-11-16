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

  const postContentInput = document.getElementById("post-content");
  const createPostBtn = document.getElementById("create-post-btn");
  const createPostName = document.querySelector(".create-post-name");
  const createPostAvatar = document.getElementById("create-post-avatar");
  const uploadImageBtn = document.getElementById("upload-image-btn");
  const postImageFile = document.getElementById("post-image-file");
  const imagePreview = document.getElementById("image-preview");
  const imagePreviewContainer = document.getElementById(
    "image-preview-container",
  );
  const removeImageBtn = document.getElementById("remove-image-btn");
  const uploadStatus = document.getElementById("upload-status");

  let userProfile = null;
  let uploadedImageUrl = null;
  let mentionSystem = null;

  // Wait for dependencies
  const waitForDependencies = () => {
    return new Promise((resolve) => {
      const check = () => {
        if (
          typeof apiRequest !== "undefined" &&
          typeof supabase !== "undefined" &&
          typeof initMentions !== "undefined"
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

  // Initialize mentions
  mentionSystem = initMentions(postContentInput);

  // Function to fetch user profile
  async function fetchUserProfile() {
    try {
      const session = JSON.parse(localStorage.getItem("supabaseSession"));
      if (!session || !session.user || !session.user.id) {
        throw new Error("User session not found.");
      }
      const userId = session.user.id;

      const response = await apiRequest(`/profile/${userId}`);
      if (response.ok) {
        const data = await response.json();
        userProfile = data;

        // Update display name
        if (createPostName && userProfile && userProfile.display_name) {
          createPostName.textContent = userProfile.display_name;
        }

        // Update avatar
        if (createPostAvatar && userProfile && userProfile.avatar_url) {
          createPostAvatar.innerHTML = `<img src="${userProfile.avatar_url}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        }
      } else {
        console.error("Failed to fetch user profile:", response.statusText);
        alert("Failed to load user profile. Please log in again.");
        window.location.href = "/login.html";
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      alert("An error occurred while loading user profile.");
      window.location.href = "/login.html";
    }
  }

  // Fetch user profile on page load
  await fetchUserProfile();

  // Handle image upload button click
  uploadImageBtn.addEventListener("click", () => {
    postImageFile.click();
  });

  // Handle file selection
  postImageFile.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast?.error?.("Please select an image file") || alert("Please select an image file");
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast?.error?.("Image size must be less than 5MB") || alert("Image size must be less than 5MB");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.src = e.target.result;
      imagePreviewContainer.style.display = "block";
    };
    reader.readAsDataURL(file);

    // Upload to Supabase storage
    uploadStatus.textContent = "Uploading...";
    uploadImageBtn.disabled = true;

    try {
      const session = JSON.parse(localStorage.getItem("supabaseSession"));
      if (!session || !session.user) {
        throw new Error("Not authenticated");
      }

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;

      // Upload file
      const { data, error } = await supabase.storage
        .from("community-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("community-images")
        .getPublicUrl(fileName);

      uploadedImageUrl = urlData.publicUrl;
      uploadStatus.textContent = "✓ Image uploaded";
      uploadStatus.style.color = "#27ae60";

      console.log("Image uploaded:", uploadedImageUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
      uploadStatus.textContent = "✗ Upload failed";
      uploadStatus.style.color = "#e74c3c";
      const errorMsg = "Failed to upload image: " + error.message;
      toast?.error?.(errorMsg) || alert(errorMsg);

      // Clear preview on error
      imagePreviewContainer.style.display = "none";
      uploadedImageUrl = null;
    } finally {
      uploadImageBtn.disabled = false;
    }
  });

  // Handle remove image button
  removeImageBtn.addEventListener("click", () => {
    imagePreviewContainer.style.display = "none";
    imagePreview.src = "";
    postImageFile.value = "";
    uploadedImageUrl = null;
    uploadStatus.textContent = "";
  });

  // Create post
  createPostBtn.addEventListener("click", async () => {
    const content = postContentInput.value.trim();

    // Validate post content using PostSchema
    const validation = PostSchema.validate({
      content: content,
      image_url: uploadedImageUrl || '',
    });

    if (!validation.valid) {
      const errors = formatValidationErrors(validation.errors);
      toast?.error?.(errors) || alert(errors);
      return;
    }

    createPostBtn.disabled = true;
    createPostBtn.textContent = "Posting...";

    try {
      // Get mentioned users
      const mentions = mentionSystem.getMentions();

      const response = await apiRequest("/posts", {
        method: "POST",
        body: JSON.stringify({
          content: content,
          image_url: uploadedImageUrl || null,
          mentions: mentions,
        }),
      });

      if (response.ok) {
        toast?.success?.("Post created successfully! 🎉") || alert("Post created successfully!");
        window.location.href = "/home.html";
      } else {
        const data = await response.json().catch(() => ({}));
        const errorMsg = data.error || response.statusText;
        toast?.error?.("Failed to create post: " + errorMsg) || alert("Failed to create post: " + errorMsg);
      }
    } catch (error) {
      console.error("Error creating post:", error);
      const errorMsg = error.message || "An error occurred. Please try again.";
      toast?.error?.(errorMsg) || alert(errorMsg);
    } finally {
      createPostBtn.disabled = false;
      createPostBtn.textContent = "Post";
    }
  });
});

