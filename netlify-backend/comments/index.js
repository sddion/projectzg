"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const auth_1 = require("../lib/auth");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
/**
 * GET /api/comments
 */
router.get("/", async (req, res) => {
    try {
        const { post_id } = req.query;
        if (!post_id) {
            return (0, middleware_1.sendError)(res, "post_id is required", 400);
        }
        const { data, error } = await supabase_1.supabase
            .from("comments")
            .select("*, community_profiles(display_name, username, avatar_url)")
            .eq("post_id", post_id);
        if (error)
            throw error;
        (0, middleware_1.sendSuccess)(res, data, 200);
    }
    catch (error) {
        (0, middleware_1.sendError)(res, error.message || "Failed to fetch comments", 400);
    }
});
/**
 * POST /api/comments
 */
router.post("/", async (req, res) => {
    try {
        const auth = (0, auth_1.getAuthHeader)(req);
        if (auth.error) {
            return (0, middleware_1.sendError)(res, auth.error, 401);
        }
        const { post_id, content } = req.body;
        if (!post_id || !content) {
            return (0, middleware_1.sendError)(res, "post_id and content are required", 400);
        }
        const author_id = await (0, auth_1.getCommunityProfileId)(auth.userId);
        const { data, error } = await supabase_1.supabase
            .from("comments")
            .insert([{ post_id, author_id, content }])
            .select();
        if (error)
            throw error;
        (0, middleware_1.sendSuccess)(res, data, 201);
    }
    catch (error) {
        (0, middleware_1.sendError)(res, error.message || "Failed to create comment", 400);
    }
});
/**
 * DELETE /api/comments
 */
router.delete("/", async (req, res) => {
    try {
        const auth = (0, auth_1.getAuthHeader)(req);
        if (auth.error) {
            return (0, middleware_1.sendError)(res, auth.error, 401);
        }
        const { comment_id } = req.query;
        if (!comment_id) {
            return (0, middleware_1.sendError)(res, "comment_id is required", 400);
        }
        const author_id = await (0, auth_1.getCommunityProfileId)(auth.userId);
        const { error } = await supabase_1.supabase
            .from("comments")
            .delete()
            .eq("id", comment_id)
            .eq("author_id", author_id);
        if (error)
            throw error;
        (0, middleware_1.sendSuccess)(res, { message: "Comment deleted successfully" }, 200);
    }
    catch (error) {
        (0, middleware_1.sendError)(res, error.message || "Failed to delete comment", 400);
    }
});
exports.default = router;
