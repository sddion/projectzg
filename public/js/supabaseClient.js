// public/js/supabaseClient.js

// These variables are injected by the server into the HTML.
const supabase = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);
