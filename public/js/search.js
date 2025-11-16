document.addEventListener("DOMContentLoaded", () => {
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
    // If no preference, check system preference
    document.body.classList.add("dark-mode");
  }

  function getCurrentUserCommunityProfileId() {
    const session = JSON.parse(localStorage.getItem("supabaseSession"));
    return session ? session.user.id : null;
  }

  async function renderSearchResult(profile) {
    const resultItem = document.createElement("div");
    resultItem.classList.add("search-result-item");

    const currentUserCommunityProfileId = getCurrentUserCommunityProfileId();
    const isCurrentUser = currentUserCommunityProfileId === profile.id;

    let followButtonHtml = "";
    if (!isCurrentUser) {
      // Without a specific API endpoint to check follow status,
      // we'll assume the initial state is 'Follow' and update dynamically.
      // The `data-is-following` attribute will be managed by handleFollowToggle.
      followButtonHtml = `
        <button
          class="btn btn-secondary follow-toggle-btn"
          data-profile-id="${profile.id}"
          data-is-following="false"
          style="flex: none; padding: 8px 16px"
        >
          Follow
        </button>
      `;
    }

    resultItem.innerHTML = `
      <div class="search-result-avatar">
        ${
          profile.avatar_url
            ? `<img src="${profile.avatar_url}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`
            : `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>`
        }
      </div>
      <div class="search-result-info">
        <div class="search-result-name">${profile.display_name}</div>
        <div class="search-result-handle">@${profile.username} • ${
      profile.followers_count || 0
    } followers</div>
      </div>
      ${followButtonHtml}
    `;
    return resultItem;
  }

  async function performSearch() {
    const query = document.getElementById("search-input").value.trim();
    const searchResultsContainer = document.getElementById(
      "search-results-container"
    );

    // Validate search query using SearchSchema
    const validation = SearchSchema.validate({
      query: query,
    });

    if (!validation.valid) {
      const errors = formatValidationErrors(validation.errors);
      searchResultsContainer.innerHTML = `<p style="color: red;">${errors}</p>`;
      return;
    }

    searchResultsContainer.innerHTML = "<p>Searching...</p>";

    const userId = getCurrentUserCommunityProfileId();
    if (!userId) {
      searchResultsContainer.innerHTML = "<p>Please sign in to search.</p>";
      window.location.href = "login.html";
      return;
    }

    try {
      const response = await apiRequest(`/search?q=${query}`);
      const profiles = await response.json();

      if (response.ok) {
        searchResultsContainer.innerHTML = "";
        if (profiles && profiles.length > 0) {
          for (const profile of profiles) {
            const resultItem = await renderSearchResult(profile);
            searchResultsContainer.appendChild(resultItem);
          }
        } else {
          searchResultsContainer.innerHTML = "<p>No results found.</p>";
        }
      } else {
        searchResultsContainer.innerHTML = `<p>Error: ${profiles.error}</p>`;
        console.error("Failed to fetch search results:", profiles.error);
        if (response.status === 401) {
          window.location.href = "login.html";
        }
      }
    } catch (error) {
      searchResultsContainer.innerHTML = `<p>Error performing search.</p>`;
      console.error("Error performing search:", error);
    }
  }

  async function handleFollowToggle(event) {
    const button = event.target.closest(".follow-toggle-btn");
    if (!button) return;

    const profileIdToToggle = button.dataset.profileId;
    let isCurrentlyFollowing = button.dataset.isFollowing === "true";

    const userId = getCurrentUserCommunityProfileId();
    if (!userId) {
      console.error("No user ID found. Please sign in.");
      window.location.href = "login.html";
      return;
    }

    try {
      let response;
      if (isCurrentlyFollowing) {
        response = await apiRequest(
          `/follows?following_id=${profileIdToToggle}`,
          {
            method: "DELETE",
          }
        );
      } else {
        response = await apiRequest("/follows", {
          method: "POST",
          body: JSON.stringify({ following_id: profileIdToToggle }),
        });
      }

      const result = await response.json();

      if (response.ok) {
        // Toggle button state
        isCurrentlyFollowing = !isCurrentlyFollowing;
        button.dataset.isFollowing = isCurrentlyFollowing;
        button.textContent = isCurrentlyFollowing ? "Following" : "Follow";
        button.classList.toggle("btn-primary", isCurrentlyFollowing);
        button.classList.toggle("btn-secondary", !isCurrentlyFollowing);
        console.log(result.message || "Follow status updated.");
        // Re-run search to update follower counts if necessary
        performSearch();
      } else {
        console.error("Failed to update follow status:", result.error);
        alert("Failed to update follow status: " + result.error);
        if (response.status === 401) {
          window.location.href = "login.html";
        }
      }
    } catch (error) {
      console.error("Error updating follow status:", error);
      alert("Error updating follow status.");
    }
  }

  // Event Listeners
  const searchInput = document.getElementById("search-input");
  const searchButton = document.getElementById("search-button");
  const searchResultsContainer = document.getElementById(
    "search-results-container"
  );

  if (searchButton) {
    searchButton.addEventListener("click", performSearch);
  }
  if (searchInput) {
    searchInput.addEventListener("keyup", (event) => {
      if (event.key === "Enter") {
        performSearch();
      }
    });
  }
  if (searchResultsContainer) {
    searchResultsContainer.addEventListener("click", handleFollowToggle);
  }

  // Optionally perform an initial empty search or load trending profiles
  // performSearch();
});
