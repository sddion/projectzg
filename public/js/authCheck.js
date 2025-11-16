document.addEventListener("DOMContentLoaded", async () => {
  const currentPath = window.location.pathname;
  const urlParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  
  // Check if this is an OAuth callback (has access_token in hash)
  const isOAuthCallback = hashParams.has("access_token");
  
  // Pages that do NOT require authentication (public pages)
  const publicPages = ["/login.html", "/signup.html", "/"];

  // Special handling for changepassword.html
  if (currentPath === "/changepassword.html") {
    // Allow access if it's a password recovery link (from email)
    const type = hashParams.get("type");
    if (type === "recovery") {
      return;
    }
    // Allow access if it's the "forgot password" initiation mode
    const mode = urlParams.get("mode");
    if (mode === "forgot") {
      return;
    }
  }

  // Get session from localStorage
  const session = localStorage.getItem("supabaseSession");
  const hasSession = !!session;

  // Route 1: No session and not on a public page → redirect to login
  if (!hasSession && !publicPages.includes(currentPath)) {
    // Allow OAuth callback to go through to login page
    if (!isOAuthCallback) {
      console.log("[AUTH] No session, redirecting to login");
      window.location.href = "/login.html";
    }
    return;
  }

  // Route 2: Has session and on public page → check if should redirect to home or complete-profile
  if (hasSession && publicPages.includes(currentPath)) {
    // Parse session
    try {
      const sessionData = JSON.parse(session);
      
      // For OAuth callbacks on login page, let handleOAuthCallback deal with routing
      if (isOAuthCallback && currentPath === "/login.html") {
        console.log("[AUTH] OAuth callback detected, letting login.js handle it");
        return;
      }

      // User is on login/signup but already logged in
      // Check if they have a complete profile
      const userId = sessionData.user?.id;
      if (userId) {
        try {
          const apiUrl = `/api/profile/${userId}`;
          const response = await fetch(apiUrl, {
            headers: {
              "Authorization": `Bearer ${sessionData.access_token}`,
            },
          });

          if (response.ok) {
            // Profile exists, go to home
            console.log("[AUTH] Session + complete profile found on public page, redirecting to home");
            window.location.href = "/home.html";
          } else if (response.status === 404) {
            // No profile, go to complete-profile
            console.log("[AUTH] Session + no profile found on public page, redirecting to complete-profile");
            window.location.href = "/complete-profile.html";
          } else {
            // Error checking profile, but we have a session, so go to home
            console.log("[AUTH] Could not verify profile, going to home");
            window.location.href = "/home.html";
          }
        } catch (error) {
          console.error("[AUTH] Error checking profile:", error);
          // Default to home if we can't verify
          window.location.href = "/home.html";
        }
      }
    } catch (error) {
      console.error("[AUTH] Error parsing session:", error);
    }
    return;
  }

  // Route 3: Has session and on protected page
  if (hasSession && !publicPages.includes(currentPath)) {
    // Check if on complete-profile page
    if (currentPath === "/complete-profile.html") {
      // Allow for now, let complete-profile.js verify the user needs it
      return;
    }
    
    // For other protected pages, session check is already done
    return;
  }

  // Route 4: Session exists but page requires more checking
  // (This shouldn't normally reach here with the above logic)
});
