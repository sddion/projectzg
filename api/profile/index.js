import { Router } from "express";
import { supabase, supabaseAdmin } from "../lib/supabase";
import { getAuthHeader } from "../lib/auth";
import { sendSuccess, sendError } from "../middleware";
const router = Router();
/**
 * POST /api/profile/create
 */
router.post("/create", async (req, res) => {
    try {
        const auth = getAuthHeader(req);
        if (auth.error) {
            return sendError(res, auth.error, 401);
        }
        const { username, display_name, bio, avatar_url, gender } = req.body;
        if (!username || !display_name) {
            return sendError(res, "Username and display name are required", 400);
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return sendError(res, "Username can only contain letters, numbers, and underscores", 400);
        }
        if (username.length < 3 || username.length > 20) {
            return sendError(res, "Username must be between 3 and 20 characters", 400);
        }
        const user_id = auth.userId;
        const { data: existingProfile } = await supabase
            .from("community_profiles")
            .select("id")
            .eq("user_id", user_id)
            .maybeSingle();
        if (existingProfile) {
            return sendError(res, "Profile already exists", 400);
        }
        const { data: existingUsername } = await supabase
            .from("community_profiles")
            .select("id")
            .eq("username", username)
            .maybeSingle();
        if (existingUsername) {
            return sendError(res, "Username is already taken", 400);
        }
        const { data, error } = await supabase
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
            return sendError(res, error.message || "Database error while creating profile", 500);
        }
        if (!data || data.length === 0) {
            return sendError(res, "Failed to create profile", 500);
        }
        sendSuccess(res, data[0], 201);
    }
    catch (error) {
        sendError(res, error.message || "Failed to create profile", 400);
    }
});
/**
 * GET /api/profile/:id
 */
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from("community_profiles")
            .select("*")
            .eq("user_id", id)
            .single();
        if (error)
            throw error;
        sendSuccess(res, data, 200);
    }
    catch (error) {
        sendError(res, error.message || "Profile not found", 404);
    }
});
/**
 * PUT /api/profile/:id
 */
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const body = req.body;
        const { data, error } = await supabase
            .from("community_profiles")
            .update(body)
            .eq("user_id", id)
            .select();
        if (error)
            throw error;
        sendSuccess(res, data, 200);
    }
    catch (error) {
        sendError(res, error.message || "Failed to update profile", 400);
    }
});
/**
 * DELETE /api/profile/:id
 */
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { data: profile, error: profileError } = await supabase
            .from("community_profiles")
            .select("id")
            .eq("user_id", id)
            .single();
        if (profileError || !profile) {
            return sendError(res, "Profile not found", 404);
        }
        const profileId = profile.id;
        const { error: deleteProfileError } = await supabase
            .from("community_profiles")
            .delete()
            .eq("id", profileId);
        if (deleteProfileError)
            throw deleteProfileError;
        if (supabaseAdmin) {
            const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(id);
            if (deleteAuthError) {
                console.error("Error deleting auth user:", deleteAuthError);
            }
        }
        sendSuccess(res, { message: "Account deleted successfully" }, 200);
    }
    catch (error) {
        console.error("Error deleting account:", error);
        sendError(res, error.message || "Failed to delete account", 500);
    }
});
export default router;
//# sourceMappingURL=index.js.map