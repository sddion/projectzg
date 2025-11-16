import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase";
import { getAuthHeader, getCommunityProfileId } from "../lib/auth";
import { sendSuccess, sendError } from "../middleware";

const router = Router();

interface FollowRequest {
  following_id: string;
}

/**
 * POST /api/follows
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const auth = getAuthHeader(req);
    if (auth.error) {
      return sendError(res, auth.error, 401);
    }

    const { following_id } = req.body as FollowRequest;

    if (!following_id) {
      return sendError(res, "following_id is required", 400);
    }

    const follower_id = await getCommunityProfileId(auth.userId!);

    const { data, error } = await supabase
      .from("follows")
      .insert([{ follower_id, following_id }])
      .select();

    if (error) throw error;

    sendSuccess(res, data, 201);
  } catch (error: any) {
    sendError(res, error.message || "Failed to follow user", 400);
  }
});

/**
 * DELETE /api/follows
 */
router.delete("/", async (req: Request, res: Response) => {
  try {
    const auth = getAuthHeader(req);
    if (auth.error) {
      return sendError(res, auth.error, 401);
    }

    const { following_id } = req.query;

    if (!following_id) {
      return sendError(res, "following_id is required", 400);
    }

    const follower_id = await getCommunityProfileId(auth.userId!);

    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", follower_id)
      .eq("following_id", following_id);

    if (error) throw error;

    sendSuccess(res, { message: "Unfollowed successfully" }, 200);
  } catch (error: any) {
    sendError(res, error.message || "Failed to unfollow", 400);
  }
});

export default router;
