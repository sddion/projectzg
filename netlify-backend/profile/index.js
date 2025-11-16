"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const auth_1 = require("../lib/auth");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
/**
 * POST /api/profile/create
 */
router.post("/create", async (req, res) => {
    try {
        const auth = (0, auth_1.getAuthHeader)(req);
        if (auth.error) {
            return (0, middleware_1.sendError)(res, auth.error, 401);
        }
        const { username, display_name, bio, avatar_url, gender } = req.body;
        if (!username || !display_name) {
            return (0, middleware_1.sendError)(res, "Username and display name are required", 400);
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return (0, middleware_1.sendError)(res, "Username can only contain letters, numbers, and underscores", 400);
        }
        if (username.length < 3 || username.length > 20) {
            return (0, middleware_1.sendError)(res, "Username must be between 3 and 20 characters", 400);
        }
        const user_id = auth.userId;
        const { data: existingProfile } = await supabase_1.supabase
            .from("community_profiles")
            .select("id")
            .eq("user_id", user_id)
            .maybeSingle();
        if (existingProfile) {
            return (0, middleware_1.sendError)(res, "Profile already exists", 400);
        }
        const { data: existingUsername } = await supabase_1.supabase
            .from("community_profiles")
            .select("id")
            .eq("username", username)
            .maybeSingle();
        if (existingUsername) {
            return (0, middleware_1.sendError)(res, "Username is already taken", 400);
        }
        const { data, error } = await supabase_1.supabase
            .from("community_profiles")
            .insert([
            {
                user_id,
                username,
                display_name,
                bio: bio || null,
                avatar_url: avatar_url || null,
                gender: gender || null,
            },
        ])
            .select();
        if (error) {
            console.error("Error creating profile:", error);
            return (0, middleware_1.sendError)(res, error.message || "Database error while creating profile", 500);
        }
        if (!data || data.length === 0) {
            return (0, middleware_1.sendError)(res, "Failed to create profile", 500);
        }
        (0, middleware_1.sendSuccess)(res, data[0], 201);
    }
    catch (error) {
        (0, middleware_1.sendError)(res, error.message || "Failed to create profile", 400);
    }
});
/**
 * GET /api/profile/:id
 */
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase_1.supabase
            .from("community_profiles")
            .select("*")
            .eq("user_id", id)
            .single();
        if (error)
            throw error;
        (0, middleware_1.sendSuccess)(res, data, 200);
    }
    catch (error) {
        (0, middleware_1.sendError)(res, error.message || "Profile not found", 404);
    }
});
/**
 * PUT /api/profile/:id
 */
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const body = req.body;
        const { data, error } = await supabase_1.supabase
            .from("community_profiles")
            .update(body)
            .eq("user_id", id)
            .select();
        if (error)
            throw error;
        (0, middleware_1.sendSuccess)(res, data, 200);
    }
    catch (error) {
        (0, middleware_1.sendError)(res, error.message || "Failed to update profile", 400);
    }
});
/**
 * DELETE /api/profile/:id
 */
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { data: profile, error: profileError } = await supabase_1.supabase
            .from("community_profiles")
            .select("id")
            .eq("user_id", id)
            .single();
        if (profileError || !profile) {
            return (0, middleware_1.sendError)(res, "Profile not found", 404);
        }
        const profileId = profile.id;
        const { error: deleteProfileError } = await supabase_1.supabase
            .from("community_profiles")
            .delete()
            .eq("id", profileId);
        if (deleteProfileError)
            throw deleteProfileError;
        if (supabase_1.supabaseAdmin) {
            const { error: deleteAuthError } = await supabase_1.supabaseAdmin.auth.admin.deleteUser(id);
            if (deleteAuthError) {
                console.error("Error deleting auth user:", deleteAuthError);
            }
        }
        (0, middleware_1.sendSuccess)(res, { message: "Account deleted successfully" }, 200);
    }
    catch (error) {
        console.error("Error deleting account:", error);
        (0, middleware_1.sendError)(res, error.message || "Failed to delete account", 500);
    }
});
exports.default = router;
