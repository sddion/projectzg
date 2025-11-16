const express = require("express");
const fs = require("fs");
const path = require("path");
const { join } = require("path");
require("dotenv").config();

const app = express();

// Supabase configuration from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Import and mount compiled TypeScript API routes
(async () => {
  try {
    // In development: routes must be compiled first (npm run build)
    // In production: compiled routes are ready in dist/api/
    const { createApiRouter } = await import("./dist/api/express-adapter.js");
    const apiRouter = createApiRouter();
    app.use("/api", apiRouter);
    console.log("✓ Express API routes loaded successfully");
  } catch (err) {
    console.warn("⚠ TypeScript API routes not compiled.");
    console.warn("  To use Express API locally, run: npm run build");
    console.log("  Static files still available at /");
  }
})();

// Function to inject Supabase config into HTML and send
function sendHtmlWithInjectedSupabaseConfig(res, filePath) {
  fs.readFile(filePath, "utf8", (err, html) => {
    if (err) {
      console.error("Error reading HTML file:", err);
      return res.status(500).send("Error loading page.");
    }
    const scriptToInject = `
      <script>
        window.SUPABASE_URL = '${SUPABASE_URL}';
        window.SUPABASE_ANON_KEY = '${SUPABASE_ANON_KEY}';
      </script>
    `;
    const modifiedHtml = html.replace("</head>", `${scriptToInject}\n</head>`);
    res.send(modifiedHtml);
  });
}

app.get("/", (req, res) => {
  sendHtmlWithInjectedSupabaseConfig(res, join(__dirname, "index.html"));
});

app.get("/changepassword.html", (req, res) => {
  sendHtmlWithInjectedSupabaseConfig(
    res,
    join(__dirname, "public", "views", "changepassword.html"),
  );
});

app.get("/createpost.html", (req, res) => {
  sendHtmlWithInjectedSupabaseConfig(
    res,
    join(__dirname, "public", "views", "createpost.html"),
  );
});

app.get("/editprofile.html", (req, res) => {
  sendHtmlWithInjectedSupabaseConfig(
    res,
    join(__dirname, "public", "views", "editprofile.html"),
  );
});

app.get("/feeds.html", (req, res) => {
  sendHtmlWithInjectedSupabaseConfig(
    res,
    join(__dirname, "public", "views", "feeds.html"),
  );
});

app.get("/home.html", (req, res) => {
  sendHtmlWithInjectedSupabaseConfig(
    res,
    join(__dirname, "public", "views", "home.html"),
  );
});

app.get("/login.html", (req, res) => {
  sendHtmlWithInjectedSupabaseConfig(
    res,
    join(__dirname, "public", "views", "login.html"),
  );
});

app.get("/notifications.html", (req, res) => {
  sendHtmlWithInjectedSupabaseConfig(
    res,
    join(__dirname, "public", "views", "notifications.html"),
  );
});

app.get("/profile.html", (req, res) => {
  sendHtmlWithInjectedSupabaseConfig(
    res,
    join(__dirname, "public", "views", "profile.html"),
  );
});

app.get("/search.html", (req, res) => {
  sendHtmlWithInjectedSupabaseConfig(
    res,
    join(__dirname, "public", "views", "search.html"),
  );
});

app.get("/settings.html", (req, res) => {
  sendHtmlWithInjectedSupabaseConfig(
    res,
    join(__dirname, "public", "views", "settings.html"),
  );
});

app.get("/signup.html", (req, res) => {
  sendHtmlWithInjectedSupabaseConfig(
    res,
    join(__dirname, "public", "views", "signup.html"),
  );
});

app.get("/complete-profile.html", (req, res) => {
  sendHtmlWithInjectedSupabaseConfig(
    res,
    join(__dirname, "public", "views", "complete-profile.html"),
  );
});

app.get("/create-story.html", (req, res) => {
  sendHtmlWithInjectedSupabaseConfig(
    res,
    join(__dirname, "public", "views", "create-story.html"),
  );
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Import and mount Express API routes (compiled from TypeScript)
(async () => {
  try {
    // Load compiled TypeScript API routes
    // Routes must be built first: npm run build
    const { createApiRouter } = await import("./dist/api/express-adapter.js");
    const apiRouter = createApiRouter();
    app.use("/api", apiRouter);
    console.log("✅ Express API router mounted at /api");
  } catch (err) {
    console.warn("⚠️  API routes not available. To use Express API locally:");
    console.warn("   1. Run: npm run build");
    console.warn("   2. Then restart the server");
    console.log("   Static files still available at /");
  }
})();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`   - Static files: /public`);
  console.log(`   - API endpoints: /api/*`);
  console.log(`   - Environment: ${process.env.NODE_ENV || "development"}\n`);
});
