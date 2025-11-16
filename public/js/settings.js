document.addEventListener("DOMContentLoaded", () => {
  const darkModeToggle = document.getElementById("darkModeToggle");
  const logoutBtn = document.getElementById("logout-btn");
  const deleteAccountBtn = document.getElementById("delete-account-btn");

  // Function to apply theme
  const applyTheme = (theme) => {
    if (theme === "dark") {
      document.body.classList.add("dark-mode");
      darkModeToggle.checked = true;
    } else {
      document.body.classList.remove("dark-mode");
      darkModeToggle.checked = false;
    }
  };

  // Load theme preference from localStorage
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    applyTheme(savedTheme);
  } else if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    // If no preference, check system preference
    applyTheme("dark");
  } else {
    applyTheme("light");
  }

  // Listen for changes on the toggle switch
  darkModeToggle.addEventListener("change", () => {
    if (darkModeToggle.checked) {
      applyTheme("dark");
      localStorage.setItem("theme", "dark");
    } else {
      applyTheme("light");
      localStorage.setItem("theme", "light");
    }
  });

  // Handle logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        const response = await apiRequest("/auth/signout", {
          method: "POST",
        });

        if (response.ok) {
          localStorage.removeItem("supabaseSession");
          localStorage.removeItem("theme"); // Clear theme preference as well
          alert("Logged out successfully!");
          window.location.href = "login.html";
        } else {
          const errorData = await response.json();
          alert("Logout failed: " + errorData.error);
        }
      } catch (error) {
        console.error("Error during logout:", error);
        alert("An error occurred during logout. Please try again.");
      }
    });
  }

  // Handle delete account
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener("click", async () => {
      const confirmMessage =
        "Are you sure you want to delete your account?\n\n" +
        "This will permanently delete:\n" +
        "- Your profile\n" +
        "- All your posts\n" +
        "- All your comments\n" +
        "- All your likes\n" +
        "- All your stories\n" +
        "- Everything associated with your account\n\n" +
        "This action CANNOT be undone!\n\n" +
        'Type "DELETE" to confirm:';

      const userInput = prompt(confirmMessage);

      if (userInput !== "DELETE") {
        if (userInput !== null) {
          alert(
            'Account deletion cancelled. You must type "DELETE" exactly to confirm.'
          );
        }
        return;
      }

      // Double confirmation
      const doubleConfirm = confirm(
        "FINAL WARNING: This will permanently delete your account and all associated data. Are you absolutely sure?"
      );

      if (!doubleConfirm) {
        alert("Account deletion cancelled.");
        return;
      }

      try {
        // Get current user ID from session
        const session = JSON.parse(localStorage.getItem("supabaseSession"));
        if (!session || !session.user || !session.user.id) {
          alert("No active session found. Please log in again.");
          window.location.href = "login.html";
          return;
        }

        const userId = session.user.id;

        // Call the delete profile endpoint
        const response = await apiRequest(`/profile/${userId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          // Clear local storage
          localStorage.removeItem("supabaseSession");
          localStorage.removeItem("theme");

          alert("Your account has been permanently deleted.");
          window.location.href = "login.html";
        } else {
          const errorData = await response.json();
          alert(
            "Failed to delete account: " + (errorData.error || "Unknown error")
          );
        }
      } catch (error) {
        console.error("Error during account deletion:", error);
        alert(
          "An error occurred while deleting your account. Please try again or contact support."
        );
      }
    });
  }
});
