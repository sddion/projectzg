document.addEventListener("DOMContentLoaded", async () => {
  // Load theme preference
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

  const selectImageBtn = document.getElementById("select-image-btn");
  const changeImageBtn = document.getElementById("change-image-btn");
  const storyImageInput = document.getElementById("story-image-input");
  const postStoryBtn = document.getElementById("post-story-btn");
  const previewContainer = document.getElementById("preview-container");
  const storyPreview = document.getElementById("story-preview");
  const uploadStatus = document.getElementById("upload-status");

  let uploadedImageUrl = null;

  // Wait for dependencies to load
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

  // Handle select image button click
  selectImageBtn.addEventListener("click", () => {
    storyImageInput.click();
  });

  // Handle change image button click
  changeImageBtn.addEventListener("click", () => {
    storyImageInput.click();
  });

  // Handle file selection
  storyImageInput.addEventListener("change", async (e) => {
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
      storyPreview.src = e.target.result;
      previewContainer.style.display = "block";
      selectImageBtn.style.display = "none";
    };
    reader.readAsDataURL(file);

    // Upload to Supabase storage
    uploadStatus.textContent = "⏳ Uploading image...";
    uploadStatus.style.color = "#666";
    postStoryBtn.disabled = true;

    try {
      const session = JSON.parse(localStorage.getItem("supabaseSession"));
      if (!session || !session.user) {
        throw new Error("Not authenticated");
      }

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${session.user.id}/story-${Date.now()}.${fileExt}`;

      // Upload file to community-images bucket
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
      uploadStatus.textContent = "✓ Ready to post your story!";
      uploadStatus.style.color = "#27ae60";
      postStoryBtn.disabled = false;

      console.log("Story image uploaded:", uploadedImageUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
      uploadStatus.textContent = "✗ Upload failed. Please try again.";
      uploadStatus.style.color = "#e74c3c";
      alert("Failed to upload image: " + error.message);

      // Reset on error
      previewContainer.style.display = "none";
      selectImageBtn.style.display = "flex";
      uploadedImageUrl = null;
    }
  });

  // Handle post story button
  postStoryBtn.addEventListener("click", async () => {
    if (!uploadedImageUrl) {
      toast?.error?.("Please upload an image first") || alert("Please upload an image first");
      return;
    }

    // Validate story using StorySchema
    const validation = StorySchema.validate({
      image_url: uploadedImageUrl,
      text: '',
    });

    if (!validation.valid) {
      const errors = formatValidationErrors(validation.errors);
      toast?.error?.(errors) || alert(errors);
      return;
    }

    postStoryBtn.disabled = true;
    postStoryBtn.textContent = "Posting...";
    uploadStatus.textContent = "⏳ Creating your story...";
    uploadStatus.style.color = "#666";

    try {
      const response = await apiRequest("/stories", {
        method: "POST",
        body: JSON.stringify({
          image_url: uploadedImageUrl,
          expires_in_hours: 24, // Story expires in 24 hours
        }),
      });

      if (response.ok) {
        const data = await response.json().catch(() => null);
        console.log("Story created:", data);
        uploadStatus.textContent = "✓ Story posted successfully!";
        uploadStatus.style.color = "#27ae60";
        toast?.success?.("Story posted! 🎉") || alert("Story posted! 🎉");

        // Redirect to home page
        setTimeout(() => {
          window.location.href = "/home.html";
        }, 500);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to post story");
      }
    } catch (error) {
      console.error("Error posting story:", error);
      uploadStatus.textContent = "✗ Failed to post story";
      uploadStatus.style.color = "#e74c3c";
      toast?.error?.("Failed to post story: " + error.message) || alert("Failed to post story: " + error.message);
      postStoryBtn.disabled = false;
      postStoryBtn.textContent = "Post";
    }
  });

  // Drag and drop support (bonus feature)
  selectImageBtn.addEventListener("dragover", (e) => {
    e.preventDefault();
    selectImageBtn.style.borderColor = "#6366f1";
    selectImageBtn.style.background = "rgba(99, 102, 241, 0.1)";
  });

  selectImageBtn.addEventListener("dragleave", (e) => {
    e.preventDefault();
    selectImageBtn.style.borderColor = "";
    selectImageBtn.style.background = "";
  });

  selectImageBtn.addEventListener("drop", (e) => {
    e.preventDefault();
    selectImageBtn.style.borderColor = "";
    selectImageBtn.style.background = "";

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      storyImageInput.files = files;
      storyImageInput.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
});
