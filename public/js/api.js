function getAccessToken() {
  const session = JSON.parse(localStorage.getItem("supabaseSession"));
  return session ? session.access_token : null;
}

async function apiRequest(endpoint, options = {}) {
  const token = getAccessToken();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  return response;
}
