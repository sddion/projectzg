"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const auth_1 = require("../lib/auth");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
/**
 * GET /api/stories
 */
router.get("/", async (req, res) => {
    try {
        const auth = (0, auth_1.getAuthHeader)(req);
        if (auth.error) {
            return (0, middleware_1.sendError)(res, auth.error, 401);
        }
        const communityProfileId = await (0, auth_1.getCommunityProfileId)(auth.userId);
        const { data, error } = await supabase_1.supabase
            .from("stories")
            .select("*, community_profiles(display_name, username, avatar_url)")
            .eq("author_id", communityProfileId)
            .gt("expires_at", new Date().toISOString())
            .order("created_at", { ascending: false });
        if (error)
            throw error;
        (0, middleware_1.sendSuccess)(res, data, 200);
    }
    catch (error) {
        (0, middleware_1.sendError)(res, error.message || "Failed to fetch stories", 400);
    }
});
/**
 * POST /api/stories
 */
router.post("/", async (req, res) => {
    try {
        const auth = (0, auth_1.getAuthHeader)(req);
        if (auth.error) {
            return (0, middleware_1.sendError)(res, auth.error, 401);
        }
        const { image_url, expires_in_hours = 24 } = req.body;
        if (!image_url) {
            return (0, middleware_1.sendError)(res, "image_url is required", 400);
        }
        const author_id = await (0, auth_1.getCommunityProfileId)(auth.userId);
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + expires_in_hours);
        const { data, error } = await supabase_1.supabase
            .from("stories")
            .insert([
            {
                author_id,
                image_url,
                expires_at: expiresAt.toISOString(),
            },
        ])
            .select();
        if (error)
            throw error;
        (0, middleware_1.sendSuccess)(res, data, 201);
    }
    catch (error) {
        (0, middleware_1.sendError)(res, error.message || "Failed to create story", 400);
    }
});
/**
 * GET /api/stories/following
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
            .from("stories")
            .select("*, community_profiles(display_name, username, avatar_url)")
            .in("author_id", followedIds.length > 0 ? followedIds : ["00000000-0000-0000-0000-000000000000"])
            .gt("expires_at", new Date().toISOString())
            .order("created_at", { ascending: false });
        if (error)
            throw error;
        (0, middleware_1.sendSuccess)(res, data, 200);
    }
    catch (error) {
        (0, middleware_1.sendError)(res, error.message || "Failed to fetch stories", 400);
    }
});
/**
 * GET /api/stories/views
 */
router.get("/views", async (req, res) => {
    try {
        const auth = (0, auth_1.getAuthHeader)(req);
        if (auth.error) {
            return (0, middleware_1.sendError)(res, auth.error, 401);
        }
        const { story_id } = req.query;
        if (!story_id) {
            return (0, middleware_1.sendError)(res, "story_id is required", 400);
        }
        const { data, error } = await supabase_1.supabase
            .from("story_views")
            .select("*, users(email, display_name, avatar_url)")
            .eq("story_id", story_id)
            .order("viewed_at", { ascending: false });
        if (error)
            throw error;
        (0, middleware_1.sendSuccess)(res, data, 200);
    }
    catch (error) {
        (0, middleware_1.sendError)(res, error.message || "Failed to fetch story views", 400);
    }
});
/**
 * POST /api/stories/views
 */
router.post("/views", async (req, res) => {
    try {
        const auth = (0, auth_1.getAuthHeader)(req);
        if (auth.error) {
            return (0, middleware_1.sendError)(res, auth.error, 401);
        }
        const { story_id } = req.body;
        if (!story_id) {
            return (0, middleware_1.sendError)(res, "story_id is required", 400);
        }
        const viewer_id = auth.userId;
        const { data, error } = await supabase_1.supabase
            .from("story_views")
            .insert([{ story_id, viewer_id }])
            .select();
        if (error) {
            if (error.code === "23505") {
                return (0, middleware_1.sendSuccess)(res, { message: "View already recorded" }, 200);
            }
            throw error;
        }
        (0, middleware_1.sendSuccess)(res, data, 201);
    }
    catch (error) {
        (0, middleware_1.sendError)(res, error.message || "Failed to mark story as viewed", 400);
    }
});
/**
 * DELETE /api/stories
 */
router.delete("/", async (req, res) => {
    try {
        const auth = (0, auth_1.getAuthHeader)(req);
        if (auth.error) {
            return (0, middleware_1.sendError)(res, auth.error, 401);
        }
        const { story_id } = req.query;
        if (!story_id) {
            return (0, middleware_1.sendError)(res, "story_id is required", 400);
        }
        const author_id = await (0, auth_1.getCommunityProfileId)(auth.userId);
        const { error } = await supabase_1.supabase
            .from("stories")
            .delete()
            .eq("id", story_id)
            .eq("author_id", author_id);
        if (error)
            throw error;
        (0, middleware_1.sendSuccess)(res, { message: "Story deleted successfully" }, 200);
    }
    catch (error) {
        (0, middleware_1.sendError)(res, error.message || "Failed to delete story", 400);
    }
});
exports.default = router;
