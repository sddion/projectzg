import { Router } from "express";
import { supabase } from "../lib/supabase";
import { getAuthHeader, getCommunityProfileId } from "../lib/auth";
import { sendSuccess, sendError } from "../middleware";
const router = Router();
/**
 * POST /api/likes
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
            .from("post_likes")
            .insert([{ post_id, user_id }])
            .select();
        if (error)
            throw error;
        sendSuccess(res, data, 201);
    }
    catch (error) {
        sendError(res, error.message || "Failed to like post", 400);
    }
});
/**
 * DELETE /api/likes
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
            .from("post_likes")
            .delete()
            .eq("post_id", post_id)
            .eq("user_id", user_id);
        if (error)
            throw error;
        sendSuccess(res, { message: "Post unliked successfully" }, 200);
    }
    catch (error) {
        sendError(res, error.message || "Failed to unlike post", 400);
    }
});
export default router;
//# sourceMappingURL=index.js.map