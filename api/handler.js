"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
/**
 * Vercel Serverless Function Handler
 * This exports a default handler that Vercel will use for each /api/* request
 *
 * When deployed to Vercel:
 * - Each file in /api becomes a serverless function
 * - GET /api/posts → /api/posts.ts
 * - POST /api/posts → /api/posts.ts
 * - Dynamic routes: /api/posts/[id].ts → /api/posts/:id
 *
 * This handler bridges your existing Express API to Vercel's serverless format
 */
async function handler(req, res) {
    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    // Handle preflight requests
    if (req.method === "OPTIONS") {
        res.status(200).end();
        return;
    }
    // Route to appropriate handler based on path
    const path = req.url?.split("?")[0] || "/";
    // This is just the structure - actual routing happens through Vercel's file-based routing
    // Each endpoint file in /api/* will be its own Vercel Function
    res.status(404).json({ error: "Not found" });
}
