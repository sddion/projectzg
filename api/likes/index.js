"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const auth_1 = require("../lib/auth");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
/**
 * POST /api/likes
 */
router.post("/", async (req, res) => {
    try {
        const auth = (0, auth_1.getAuthHeader)(req);
        if (auth.error) {
            return (0, middleware_1.sendError)(res, auth.error, 401);
        }
        const { post_id } = req.body;
        if (!post_id) {
            return (0, middleware_1.sendError)(res, "post_id is required", 400);
        }
        const user_id = await (0, auth_1.getCommunityProfileId)(auth.userId);
        const { data, error } = await supabase_1.supabase
            .from("post_likes")
            .insert([{ post_id, user_id }])
            .select();
        if (error)
            throw error;
        (0, middleware_1.sendSuccess)(res, data, 201);
    }
    catch (error) {
        (0, middleware_1.sendError)(res, error.message || "Failed to like post", 400);
    }
});
/**
 * DELETE /api/likes
 */
router.delete("/", async (req, res) => {
    try {
        const auth = (0, auth_1.getAuthHeader)(req);
        if (auth.error) {
            return (0, middleware_1.sendError)(res, auth.error, 401);
        }
        const { post_id } = req.query;
        if (!post_id) {
            return (0, middleware_1.sendError)(res, "post_id is required", 400);
        }
        const user_id = await (0, auth_1.getCommunityProfileId)(auth.userId);
        const { error } = await supabase_1.supabase
            .from("post_likes")
            .delete()
            .eq("post_id", post_id)
            .eq("user_id", user_id);
        if (error)
            throw error;
        (0, middleware_1.sendSuccess)(res, { message: "Post unliked successfully" }, 200);
    }
    catch (error) {
        (0, middleware_1.sendError)(res, error.message || "Failed to unlike post", 400);
    }
});
exports.default = router;
