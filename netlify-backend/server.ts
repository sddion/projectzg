import serverless from "serverless-http";
import express from "express";
import { createApiRouter } from "./express-adapter";

const app = express();
app.use("/api", createApiRouter());

// Add CORS headers for all responses
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  next();
});

// Handle preflight requests
app.options("*", (req, res) => {
  res.status(200).end();
});

export const handler = serverless(app);
