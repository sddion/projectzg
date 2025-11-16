"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiRouter = createApiRouter;
const express_1 = require("express");
const index_1 = __importDefault(require("./auth/index"));
const index_2 = __importDefault(require("./posts/index"));
const index_3 = __importDefault(require("./comments/index"));
const index_4 = __importDefault(require("./profile/index"));
const index_5 = __importDefault(require("./likes/index"));
const index_6 = __importDefault(require("./follows/index"));
const index_7 = __importDefault(require("./stories/index"));
const index_8 = __importDefault(require("./notifications/index"));
const index_9 = __importDefault(require("./search/index"));
const index_10 = __importDefault(require("./saved-posts/index"));
/**
 * Create Express.js API router
 * Mounts all API route handlers
 */
function createApiRouter() {
    const router = (0, express_1.Router)();
    // Health check
    router.get("/health", (req, res) => {
        res.json({ status: "ok", timestamp: new Date().toISOString() });
    });
    // Mount API routes
    router.use("/auth", index_1.default);
    router.use("/posts", index_2.default);
    router.use("/comments", index_3.default);
    router.use("/profile", index_4.default);
    router.use("/likes", index_5.default);
    router.use("/follows", index_6.default);
    router.use("/stories", index_7.default);
    router.use("/notifications", index_8.default);
    router.use("/search", index_9.default);
    router.use("/saved-posts", index_10.default);
    return router;
}
exports.default = createApiRouter;
