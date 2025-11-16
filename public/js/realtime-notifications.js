// Real-time Notifications Handler using Supabase Realtime
// Provides live notification updates and toast alerts

class RealtimeNotifications {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
    this.channel = null;
    this.userId = null;
    this.communityProfileId = null;
    this.isSubscribed = false;
    this.onNotificationCallback = null;
  }

  // Initialize real-time notifications for a user
  async init(userId, communityProfileId, onNotification) {
    this.userId = userId;
    this.communityProfileId = communityProfileId;
    this.onNotificationCallback = onNotification;

    // Subscribe to notifications channel
    await this.subscribe();

    // Also set up database changes subscription
    await this.subscribeToNotificationsTable();
  }

  // Subscribe to user-specific notification channel
  async subscribe() {
    if (this.isSubscribed || !this.communityProfileId) {
      return;
    }

    try {
      // Create a channel for this user
      this.channel = this.supabase.channel(
        `notifications:${this.communityProfileId}`,
        {
          config: {
            broadcast: { self: false },
            presence: { key: this.communityProfileId },
          },
        }
      );

      // Listen for broadcast messages
      this.channel.on("broadcast", { event: "new_notification" }, (payload) => {
        this.handleNewNotification(payload.payload);
      });

      // Subscribe to the channel
      const status = await this.channel.subscribe();

      if (status === "SUBSCRIBED") {
        this.isSubscribed = true;
        console.log("✅ Real-time notifications subscribed");
      } else {
        console.error("❌ Failed to subscribe to real-time notifications");
      }
    } catch (error) {
      console.error("Error subscribing to real-time notifications:", error);
    }
  }

  // Subscribe to notifications table changes
  async subscribeToNotificationsTable() {
    try {
      // Listen for INSERT events on notifications table
      this.supabase
        .channel("notifications_changes")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `recipient_id=eq.${this.communityProfileId}`,
          },
          (payload) => {
            this.handleDatabaseNotification(payload.new);
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log("✅ Subscribed to notifications table changes");
          }
        });
    } catch (error) {
      console.error("Error subscribing to notifications table:", error);
    }
  }

  // Handle new notification from broadcast
  handleNewNotification(notification) {
    console.log("📬 New notification received:", notification);

    // Update store if available
    if (typeof appStore !== "undefined") {
      appStore.dispatch(actions.addNotification(notification));
      appStore.dispatch(actions.incrementUnreadNotifications());
    }

    // Show toast notification
    this.showToastNotification(notification);

    // Update notification badge
    this.updateNotificationBadge();

    // Call custom callback if provided
    if (this.onNotificationCallback) {
      this.onNotificationCallback(notification);
    }

    // Play notification sound
    this.playNotificationSound();
  }

  // Handle notification from database change
  async handleDatabaseNotification(notification) {
    console.log("📬 Database notification received:", notification);

    // Fetch full notification details with sender info
    try {
      const { data, error } = await this.supabase
        .from("notifications")
        .select(
          `
                    *,
                    sender:community_profiles!notifications_sender_id_fkey(
                        id,
                        display_name,
                        username,
                        avatar_url
                    )
                `
        )
        .eq("id", notification.id)
        .single();

      if (error) throw error;

      this.handleNewNotification(data);
    } catch (error) {
      console.error("Error fetching notification details:", error);
      // Fallback to basic notification
      this.handleNewNotification(notification);
    }
  }

  // Show toast notification
  showToastNotification(notification) {
    if (typeof toast === "undefined") return;

    const message = this.formatNotificationMessage(notification);
    const type = this.getNotificationType(notification.type);

    toast.show(message, type, 4000);
  }

  // Format notification message for display
  formatNotificationMessage(notification) {
    const sender =
      notification.sender?.display_name ||
      notification.sender?.username ||
      "Someone";

    switch (notification.type) {
      case "like":
        return `${sender} liked your post`;
      case "dislike":
        return `${sender} disliked your post`;
      case "comment":
        return `${sender} commented on your post`;
      case "follow":
        return `${sender} started following you`;
      case "mention":
        return `${sender} mentioned you in a comment`;
      case "story_mention":
        return `${sender} mentioned you in their story`;
      case "story_view":
        return `${sender} viewed your story`;
      default:
        return `New notification from ${sender}`;
    }
  }

  // Get toast type based on notification type
  getNotificationType(notificationType) {
    switch (notificationType) {
      case "like":
      case "follow":
        return "success";
      case "dislike":
        return "warning";
      case "comment":
      case "mention":
      case "story_mention":
        return "info";
      default:
        return "info";
    }
  }

  // Update notification badge in UI
  updateNotificationBadge() {
    const badge = document.querySelector(".notification-badge");
    if (!badge) return;

    let count = 0;

    // Get count from store if available
    if (typeof appStore !== "undefined") {
      count = appStore.getState().unreadNotificationsCount;
    }

    if (count > 0) {
      badge.textContent = count > 99 ? "99+" : count;
      badge.style.display = "flex";
    } else {
      badge.style.display = "none";
    }
  }

  // Play notification sound
  playNotificationSound() {
    try {
      // Check if user has enabled sounds
      const soundEnabled =
        localStorage.getItem("notificationSoundEnabled") !== "false";

      if (!soundEnabled) return;

      // Create and play sound
      const audio = new Audio(
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjeP1PLQiDcJFl+/7+yiQAYLUqvp66NeEApGn+Dyu2ciBjeP1PLPiDUJFl+/7+uiPwYLUqvn6qNdEApGnt/yuWwiBjeO0/LPijcJFl+/7uuiPgYLUqjn6KRcFApGnd/xt2wiBjaN0/LPiTgIFl7A7uqiPgYLUajm56RcFApGnd/xumwiBjaN0/LOijgIFl2/7uuiPgYLUKfm5qRcFApFnN7yuWwiBjWM0vLOizgIFl2/7+uiPgYKUKbm5qRdFApFnN7yumwiBjWM0fLOjDgIFl2/7+uhPgYKT6bm5aRdFApFnN3yvGwiBjWM0fLNjDgIFl2+7uugPgYKT6Xl5KReEwpEnN3xvmwiBjSL0fLNjTgIFly+7uugPgYKT6Tl5KNdEwlEm93wv2siBjOL0fLMjTcIFlu97uqfPgUKTqPk46FcEglDmtzwwGsiBjKL0PLMjTcIFlu+7uqfPgUKTqPk46FdEglDmdzwwGwhBjGLz/LMjjcIFlq97emfPQUJTqLj46FdEglCmdvwwW0hBjCLz/HLjjYIFlm97OifPQQJTaDi4p9dEQlBmNrvwW4gBi+Kz/HKjjYIFli96+ifPQQITJ/i4p5dEAk/ltnuwm4gBi6Jz/HKjzYHFli96+ifPQQITJ7h4Z5cEAk+ltbvwm4gBi2Iz/HLjzYHFle86+ifPQUITJ7h4Z1cEAk9ldXuwW8gBiyIz/DLkDYHFla86+iePAQHTJ3g4J1cDwk8lNTuw3AgBiyIzvDLkDYHFlW86uiePAQHTJ3g4JxcDwk7k9Ltw3AgBiuHzvDLkTUHFVO76uadPAMHTJ3f35xcDwk6ktLtxHEgBiuHzvDKkTUHFFO76uabPAMGS5zf351bDgg5kdHrxXEfBiqGzvDKkjUGFFI76+abOwMGS5vf353bDgg4kdDqxXIfBimFzvDKkjQGFFE76+aaPAMGSpve3p3aDgg3kc/qxnIfBimFze/KkzQGFE867OWaOwMFSprc3Z7aDQc3kM7pxnQeBiiFze/KkzQGE0467OWZOwMFSZnb3J3bDQc2j83pxnUeBieFze/KlDMGE0w66+WZOwMFSJfa3JvbDAc1js3ox3UeBiaEze/KlDMGEkw56+WZOgMFR5bZ25vbDAc0jszox3YeBiWEze7JlDIGEko56+SYOgMERpXY2prbDAczisvnx3YdBiSDze7JlDIFEUk56+SYOQIERZTX2ZrbCwcyicvmyHYdBiODze7IlDIFEUk46eSXOQIDRJPW2JvaCwcxicrmyHcdBiKCze7IlTEFEEg46OSXOAIDQZHV15rZCgcxiMnlyHgdBiGCzO7IlTEEEEU46OSXOAICQJDUl5rZCQcxh8jkyHkdBR+CzO7IlTAED0Q46OSWOAICPo/Tl5nZCQcvhsjkyHkdBR+BzO/IlTAED0M35+OWNwICPo7Tl5jYCQcuhcfkyHocBR6AzO7HljAED0I35+OWNwEBPY3SlpjYCQcthcbkyHocBR5/y+7HlzAED0E25uOWNwEBPIvSlZfYCAcshMXjyHodBR1/y+7HlzAED0E15uKVNwEBPIrRlZfXCAcrhMTiyXodBR1+yu3Hl+++++++++v"
      );
      audio.volume = 0.3;
      audio
        .play()
        .catch((e) => console.log("Could not play notification sound:", e));
    } catch (error) {
      console.log("Error playing notification sound:", error);
    }
  }

  // Send a notification to another user (broadcast)
  async sendNotification(recipientId, notification) {
    try {
      // Create channel for recipient
      const recipientChannel = this.supabase.channel(
        `notifications:${recipientId}`
      );

      // Send broadcast
      await recipientChannel.send({
        type: "broadcast",
        event: "new_notification",
        payload: notification,
      });

      console.log("✅ Notification sent to user:", recipientId);
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const { error } = await this.supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;

      // Update store
      if (typeof appStore !== "undefined") {
        appStore.dispatch(actions.markNotificationAsRead(notificationId));
      }

      // Update badge
      this.updateNotificationBadge();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      const { error } = await this.supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("recipient_id", this.communityProfileId)
        .eq("is_read", false);

      if (error) throw error;

      // Update store
      if (typeof appStore !== "undefined") {
        appStore.dispatch(actions.markAllNotificationsAsRead());
      }

      // Update badge
      this.updateNotificationBadge();

      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to mark notifications as read");
    }
  }

  // Unsubscribe from real-time notifications
  async unsubscribe() {
    try {
      if (this.channel) {
        await this.supabase.removeChannel(this.channel);
        this.channel = null;
      }

      this.isSubscribed = false;
      console.log("✅ Real-time notifications unsubscribed");
    } catch (error) {
      console.error("Error unsubscribing from real-time notifications:", error);
    }
  }

  // Toggle notification sounds
  toggleSound(enabled) {
    localStorage.setItem("notificationSoundEnabled", enabled.toString());
    toast.info(
      enabled ? "Notification sounds enabled" : "Notification sounds disabled"
    );
  }

  // Check if sounds are enabled
  isSoundEnabled() {
    return localStorage.getItem("notificationSoundEnabled") !== "false";
  }
}

// Create global instance (will be initialized when user logs in)
let realtimeNotifications = null;

// Initialize function to be called after login
async function initRealtimeNotifications(
  supabaseClient,
  userId,
  communityProfileId,
  onNotification
) {
  if (realtimeNotifications) {
    await realtimeNotifications.unsubscribe();
  }

  realtimeNotifications = new RealtimeNotifications(supabaseClient);
  await realtimeNotifications.init(userId, communityProfileId, onNotification);

  return realtimeNotifications;
}

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = { RealtimeNotifications, initRealtimeNotifications };
}
