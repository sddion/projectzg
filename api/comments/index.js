import { Router } from "express";
import { supabase } from "../lib/supabase";
import { getAuthHeader, getCommunityProfileId } from "../lib/auth";
import { sendSuccess, sendError } from "../middleware";
const router = Router();
/**
 * GET /api/comments
 */
router.get("/", async (req, res) => {
    try {
        const { post_id } = req.query;
        if (!post_id) {
            return sendError(res, "post_id is required", 400);
        }
        const { data, error } = await supabase
            .from("comments")
            .select("*, community_profiles(display_name, username, avatar_url)")
            .eq("post_id", post_id);
        if (error)
            throw error;
        sendSuccess(res, data, 200);
    }
    catch (error) {
        sendError(res, error.message || "Failed to fetch comments", 400);
    }
});
/**
 * POST /api/comments
 */
router.post("/", async (req, res) => {
    try {
        const auth = getAuthHeader(req);
        if (auth.error) {
            return sendError(res, auth.error, 401);
        }
        const { post_id, content } = req.body;
        if (!post_id || !content) {
            return sendError(res, "post_id and content are required", 400);
        }
        const author_id = await getCommunityProfileId(auth.userId);
        const { data, error } = await supabase
            .from("comments")
            .insert([{ post_id, author_id, content }])
            .select();
        if (error)
            throw error;
        sendSuccess(res, data, 201);
    }
    catch (error) {
        sendError(res, error.message || "Failed to create comment", 400);
    }
});
/**
 * DELETE /api/comments
 */
router.delete("/", async (req, res) => {
    try {
        const auth = getAuthHeader(req);
        if (auth.error) {
            return sendError(res, auth.error, 401);
        }
        const { comment_id } = req.query;
        if (!comment_id) {
            return sendError(res, "comment_id is required", 400);
        }
        const author_id = await getCommunityProfileId(auth.userId);
        const { error } = await supabase
            .from("comments")
            .delete()
            .eq("id", comment_id)
            .eq("author_id", author_id);
        if (error)
            throw error;
        sendSuccess(res, { message: "Comment deleted successfully" }, 200);
    }
    catch (error) {
        sendError(res, error.message || "Failed to delete comment", 400);
    }
});
export default router;
//# sourceMappingURL=index.js.map