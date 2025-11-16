"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const auth_1 = require("../lib/auth");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
/**
 * POST /api/follows
 */
router.post("/", async (req, res) => {
    try {
        const auth = (0, auth_1.getAuthHeader)(req);
        if (auth.error) {
            return (0, middleware_1.sendError)(res, auth.error, 401);
        }
        const { following_id } = req.body;
        if (!following_id) {
            return (0, middleware_1.sendError)(res, "following_id is required", 400);
        }
        const follower_id = await (0, auth_1.getCommunityProfileId)(auth.userId);
        const { data, error } = await supabase_1.supabase
            .from("follows")
            .insert([{ follower_id, following_id }])
            .select();
        if (error)
            throw error;
        (0, middleware_1.sendSuccess)(res, data, 201);
    }
    catch (error) {
        (0, middleware_1.sendError)(res, error.message || "Failed to follow user", 400);
    }
});
/**
 * DELETE /api/follows
 */
router.delete("/", async (req, res) => {
    try {
        const auth = (0, auth_1.getAuthHeader)(req);
        if (auth.error) {
            return (0, middleware_1.sendError)(res, auth.error, 401);
        }
        const { following_id } = req.query;
        if (!following_id) {
            return (0, middleware_1.sendError)(res, "following_id is required", 400);
        }
        const follower_id = await (0, auth_1.getCommunityProfileId)(auth.userId);
        const { error } = await supabase_1.supabase
            .from("follows")
            .delete()
            .eq("follower_id", follower_id)
            .eq("following_id", following_id);
        if (error)
            throw error;
        (0, middleware_1.sendSuccess)(res, { message: "Unfollowed successfully" }, 200);
    }
    catch (error) {
        (0, middleware_1.sendError)(res, error.message || "Failed to unfollow", 400);
    }
});
exports.default = router;
