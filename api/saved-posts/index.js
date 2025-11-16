import { Router } from "express";
import { supabase } from "../lib/supabase";
import { getAuthHeader, getCommunityProfileId } from "../lib/auth";
import { sendSuccess, sendError } from "../middleware";
const router = Router();
/**
 * GET /api/saved-posts
 */
router.get("/", async (req, res) => {
    try {
        const auth = getAuthHeader(req);
        if (auth.error) {
            return sendError(res, auth.error, 401);
        }
        const communityProfileId = await getCommunityProfileId(auth.userId);
        const { data, error } = await supabase
            .from("saved_posts")
            .select("*, posts(*, community_profiles(display_name, username, avatar_url))")
            .eq("user_id", communityProfileId)
            .order("created_at", { ascending: false });
        if (error)
            throw error;
        sendSuccess(res, data, 200);
    }
    catch (error) {
        sendError(res, error.message || "Failed to fetch saved posts", 400);
    }
});
/**
 * POST /api/saved-posts
 */
router.post("/", async (req, res) => {
    try {
        const auth = getAuthHeader(req);
        if (auth.error) {
            return sendError(res, auth.error, 401);
        }
        const { post_id } = req.body;
        if (!post_id) {
            return sendError(res, "post_id is required", 400);
        }
        const user_id = await getCommunityProfileId(auth.userId);
        const { data, error } = await supabase
            .from("saved_posts")
            .insert([{ post_id, user_id }])
            .select();
        if (error)
            throw error;
        sendSuccess(res, data, 201);
    }
    catch (error) {
        sendError(res, error.message || "Failed to save post", 400);
    }
});
/**
 * DELETE /api/saved-posts
 */
router.delete("/", async (req, res) => {
    try {
        const auth = getAuthHeader(req);
        if (auth.error) {
            return sendError(res, auth.error, 401);
        }
        const { post_id } = req.query;
        if (!post_id) {
            return sendError(res, "post_id is required", 400);
        }
        const user_id = await getCommunityProfileId(auth.userId);
        const { error } = await supabase
            .from("saved_posts")
            .delete()
            .eq("post_id", post_id)
            .eq("user_id", user_id);
        if (error)
            throw error;
        sendSuccess(res, { message: "Post unsaved successfully" }, 200);
    }
    catch (error) {
        sendError(res, error.message || "Failed to unsave post", 400);
    }
});
export default router;
//# sourceMappingURL=index.js.map