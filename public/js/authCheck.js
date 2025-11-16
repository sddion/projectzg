document.addEventListener("DOMContentLoaded", () => {
  const session = localStorage.getItem("supabaseSession");
  const currentPath = window.location.pathname;
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get("mode");

  // Pages that do NOT require authentication (public pages)
  const publicPages = ["/login.html", "/signup.html", "/"];

  // Special handling for changepassword.html
  if (currentPath === "/changepassword.html") {
    // Allow access if it's a password recovery link (from email)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");
    if (type === "recovery") {
      return;
    }
    // Allow access if it's the "forgot password" initiation mode
    if (mode === "forgot") {
      return;
    }
  }

  // If not a public page and no session, redirect to login
  if (!session && !publicPages.includes(currentPath)) {
    window.location.href = "/login.html";
  }
});
