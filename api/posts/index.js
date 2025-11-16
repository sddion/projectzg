"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const auth_1 = require("../lib/auth");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
/**
 * GET /api/posts
 */
router.get("/", async (req, res) => {
    try {
        const { data, error } = await supabase_1.supabase
            .from("posts")
            .select("*, community_profiles(display_name, username, avatar_url)")
            .order("created_at", { ascending: false });
        if (error)
            throw error;
        (0, middleware_1.sendSuccess)(res, data, 200);
    }
    catch (error) {
        (0, middleware_1.sendError)(res, error.message || "Failed to fetch posts", 400);
    }
});
/**
 * POST /api/posts
 */
router.post("/", async (req, res) => {
    try {
        const auth = (0, auth_1.getAuthHeader)(req);
        if (auth.error) {
            return (0, middleware_1.sendError)(res, auth.error, 401);
        }
        const { content, image_url } = req.body;
        if (!content) {
            return (0, middleware_1.sendError)(res, "Content is required", 400);
        }
        const author_id = await (0, auth_1.getCommunityProfileId)(auth.userId);
        const { data, error } = await supabase_1.supabase
            .from("posts")
            .insert([{ author_id, content, image_url }])
            .select();
        if (error)
            throw error;
        (0, middleware_1.sendSuccess)(res, data, 201);
    }
    catch (error) {
        (0, middleware_1.sendError)(res, error.message || "Failed to create post", 400);
    }
});
/**
 * GET /api/posts/following
 */
router.get("/following", async (req, res) => {
    try {
        const auth = (0, auth_1.getAuthHeader)(req);
        if (auth.error) {
            return (0, middleware_1.sendError)(res, auth.error, 401);
        }
        const communityProfileId = await (0, auth_1.getCommunityProfileId)(auth.userId);
        const { data: follows, error: followsError } = await supabase_1.supabase
            .from("follows")
            .select("following_id")
            .eq("follower_id", communityProfileId);
        if (followsError)
            throw followsError;
        const followedIds = follows?.map((f) => f.following_id) || [];
        const { data, error } = await supabase_1.supabase
            .from("posts")
            .select("*, community_profiles(display_name, username, avatar_url)")
            .in("author_id", followedIds.length > 0 ? followedIds : ["00000000-0000-0000-0000-000000000000"])
            .order("created_at", { ascending: false });
        if (error)
            throw error;
        (0, middleware_1.sendSuccess)(res, data, 200);
    }
    catch (error) {
        (0, middleware_1.sendError)(res, error.message || "Failed to fetch posts", 400);
    }
});
/**
 * GET /api/posts/:id
 */
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase_1.supabase
            .from("posts")
            .select("*, community_profiles(display_name, username, avatar_url)")
            .eq("id", id)
            .single();
        if (error)
            throw error;
        (0, middleware_1.sendSuccess)(res, data, 200);
    }
    catch (error) {
        (0, middleware_1.sendError)(res, error.message || "Post not found", 404);
    }
});
/**
 * PUT /api/posts/:id
 */
router.put("/:id", async (req, res) => {
    try {
        const auth = (0, auth_1.getAuthHeader)(req);
        if (auth.error) {
            return (0, middleware_1.sendError)(res, auth.error, 401);
        }
        const { id } = req.params;
        const body = req.body;
        const author_id = await (0, auth_1.getCommunityProfileId)(auth.userId);
        const { data, error } = await supabase_1.supabase
            .from("posts")
            .update(body)
            .eq("id", id)
            .eq("author_id", author_id)
            .select();
        if (error)
            throw error;
        if (!data || data.length === 0) {
            return (0, middleware_1.sendError)(res, "Post not found or unauthorized", 403);
        }
        (0, middleware_1.sendSuccess)(res, data, 200);
    }
    catch (error) {
        (0, middleware_1.sendError)(res, error.message || "Failed to update post", 400);
    }
});
/**
 * DELETE /api/posts/:id
 */
router.delete("/:id", async (req, res) => {
    try {
        const auth = (0, auth_1.getAuthHeader)(req);
        if (auth.error) {
            return (0, middleware_1.sendError)(res, auth.error, 401);
        }
        const { id } = req.params;
        const author_id = await (0, auth_1.getCommunityProfileId)(auth.userId);
        const { error } = await supabase_1.supabase
            .from("posts")
            .delete()
            .eq("id", id)
            .eq("author_id", author_id);
        if (error)
            throw error;
        (0, middleware_1.sendSuccess)(res, { message: "Post deleted successfully" }, 200);
    }
    catch (error) {
        (0, middleware_1.sendError)(res, error.message || "Failed to delete post", 400);
    }
});
exports.default = router;
