// PWA Install Handler
let deferredPrompt;
let isStandalone = false;

// Check if app is already installed
if (
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true
) {
  isStandalone = true;
  console.log("[PWA] App is running in standalone mode");
}

// Register Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log(
          "[PWA] Service Worker registered successfully:",
          registration.scope
        );

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute
      })
      .catch((error) => {
        console.error("[PWA] Service Worker registration failed:", error);
      });
  });
}

// Listen for service worker updates
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    console.log("[PWA] Service Worker updated, reloading page...");
    window.location.reload();
  });
}

// Handle beforeinstallprompt event
window.addEventListener("beforeinstallprompt", (e) => {
  console.log("[PWA] beforeinstallprompt event fired");

  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();

  // Stash the event so it can be triggered later
  deferredPrompt = e;

  // Check if user has dismissed the banner before
  const installDismissed = localStorage.getItem("pwa-install-dismissed");
  const installDismissedTime = localStorage.getItem(
    "pwa-install-dismissed-time"
  );

  // Show banner again after 7 days
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  const showAgain =
    !installDismissedTime ||
    Date.now() - parseInt(installDismissedTime) > sevenDaysInMs;

  if (!installDismissed || showAgain) {
    // Show install banner
    showInstallBanner();
  }
});

// Show install banner
function showInstallBanner() {
  const banner = document.getElementById("install-banner");
  if (banner && !isStandalone) {
    banner.classList.add("show");

    // Install button click handler
    const installBtn = document.getElementById("install-btn");
    if (installBtn) {
      installBtn.addEventListener("click", async () => {
        if (deferredPrompt) {
          // Show the install prompt
          deferredPrompt.prompt();

          // Wait for the user to respond to the prompt
          const { outcome } = await deferredPrompt.userChoice;
          console.log(`[PWA] User response to install prompt: ${outcome}`);

          if (outcome === "accepted") {
            console.log("[PWA] User accepted the install prompt");
            localStorage.removeItem("pwa-install-dismissed");
            localStorage.removeItem("pwa-install-dismissed-time");
          } else {
            console.log("[PWA] User dismissed the install prompt");
          }

          // Clear the deferredPrompt
          deferredPrompt = null;

          // Hide banner
          banner.classList.remove("show");
        }
      });
    }

    // Close banner button click handler
    const closeBannerBtn = document.getElementById("close-banner-btn");
    if (closeBannerBtn) {
      closeBannerBtn.addEventListener("click", () => {
        banner.classList.remove("show");
        localStorage.setItem("pwa-install-dismissed", "true");
        localStorage.setItem(
          "pwa-install-dismissed-time",
          Date.now().toString()
        );
        console.log("[PWA] Install banner dismissed by user");
      });
    }
  }
}

// Listen for app installed event
window.addEventListener("appinstalled", (e) => {
  console.log("[PWA] App installed successfully");

  // Clear the deferredPrompt
  deferredPrompt = null;

  // Hide banner if visible
  const banner = document.getElementById("install-banner");
  if (banner) {
    banner.classList.remove("show");
  }

  // Clear dismissed state
  localStorage.removeItem("pwa-install-dismissed");
  localStorage.removeItem("pwa-install-dismissed-time");

  // Optional: Show a thank you message or redirect
  console.log("[PWA] Thank you for installing ProjectZG!");
});

// iOS Install Instructions
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function isInStandaloneMode() {
  return (
    window.navigator.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

// Show iOS-specific install instructions
if (isIOS() && !isInStandaloneMode()) {
  window.addEventListener("load", () => {
    const installDismissed = localStorage.getItem("pwa-install-dismissed");
    const installDismissedTime = localStorage.getItem(
      "pwa-install-dismissed-time"
    );

    // Show banner again after 7 days
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    const showAgain =
      !installDismissedTime ||
      Date.now() - parseInt(installDismissedTime) > sevenDaysInMs;

    if (!installDismissed || showAgain) {
      showIOSInstallBanner();
    }
  });
}

function showIOSInstallBanner() {
  const banner = document.getElementById("install-banner");
  if (banner) {
    // Update banner text for iOS
    const bannerText = banner.querySelector(".install-banner-text h3");
    const bannerDesc = banner.querySelector(".install-banner-text p");

    if (bannerText) {
      bannerText.textContent = "📱 Install ProjectZG";
    }

    if (bannerDesc) {
      bannerDesc.textContent = "Tap Share → Add to Home Screen";
    }

    banner.classList.add("show");

    // For iOS, the install button opens a modal with instructions
    const installBtn = document.getElementById("install-btn");
    if (installBtn) {
      installBtn.textContent = "How?";
      installBtn.addEventListener("click", () => {
        alert(
          "To install ProjectZG on iOS:\n\n" +
            "1. Tap the Share button (square with arrow)\n" +
            '2. Scroll down and tap "Add to Home Screen"\n' +
            '3. Tap "Add" in the top right corner\n\n' +
            "The app will appear on your home screen!"
        );
      });
    }

    // Close banner button
    const closeBannerBtn = document.getElementById("close-banner-btn");
    if (closeBannerBtn) {
      closeBannerBtn.addEventListener("click", () => {
        banner.classList.remove("show");
        localStorage.setItem("pwa-install-dismissed", "true");
        localStorage.setItem(
          "pwa-install-dismissed-time",
          Date.now().toString()
        );
      });
    }
  }
}

// Handle online/offline status
window.addEventListener("online", () => {
  console.log("[PWA] App is online");
  // Optional: Show a notification that the app is back online
});

window.addEventListener("offline", () => {
  console.log("[PWA] App is offline");
  // Optional: Show a notification that the app is offline
});

// Log PWA status
console.log("[PWA] PWA features initialized");
console.log("[PWA] Standalone mode:", isStandalone);
console.log("[PWA] iOS device:", isIOS());
console.log("[PWA] Service Worker supported:", "serviceWorker" in navigator);
