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

  function timeAgo(dateString) {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m ago`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    } else {
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }
  }

  function renderNotification(notification) {
    const notificationElement = document.createElement("div");
    notificationElement.classList.add("notification-item");

    const actorDisplayName = notification.actor
      ? notification.actor.display_name || notification.actor.username
      : "Unknown";
    const actorAvatarUrl = notification.actor
      ? notification.actor.avatar_url
      : "";

    let notificationText = "";
    switch (notification.type) {
      case "like":
        notificationText = `<strong>${actorDisplayName}</strong> liked your post`;
        break;
      case "comment":
        notificationText = `<strong>${actorDisplayName}</strong> commented on your post: "${notification.content}"`;
        break;
      case "follow":
        notificationText = `<strong>${actorDisplayName}</strong> started following you`;
        break;
      default:
        notificationText = `<strong>${actorDisplayName}</strong> has a new notification`;
    }

    notificationElement.innerHTML = `
      <div class="notification-avatar">
        ${
          actorAvatarUrl
            ? `<img src="${actorAvatarUrl}" alt="Actor Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`
            : `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>`
        }
      </div>
      <div class="notification-content">
        <div class="notification-text">${notificationText}</div>
        <div class="notification-time">${timeAgo(notification.created_at)}</div>
      </div>
    `;
    return notificationElement;
  }

  async function fetchNotifications() {
    const notificationsContainer = document.getElementById(
      "notifications-container"
    );
    notificationsContainer.innerHTML = "<p>Loading notifications...</p>"; // Add loading message

    try {
      const response = await apiRequest("/notifications");
      const notifications = await response.json();

      if (response.ok) {
        notificationsContainer.innerHTML = ""; // Clear loading message

        if (notifications && notifications.length > 0) {
          notifications.forEach((notification) => {
            notificationsContainer.appendChild(
              renderNotification(notification)
            );
          });
        } else {
          notificationsContainer.innerHTML =
            "<p>No notifications to display.</p>";
        }
      } else {
        console.error("Failed to fetch notifications:", notifications.error);
        notificationsContainer.innerHTML = `<p>Error loading notifications: ${notifications.error}</p>`; // Display error message
        if (response.status === 401) {
          window.location.href = "login.html";
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      notificationsContainer.innerHTML = "<p>Error loading notifications.</p>"; // Display generic error message
    }
  }

  // Fetch notifications when the page loads
  fetchNotifications();
});
