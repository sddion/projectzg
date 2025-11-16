import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase";
import { getAuthHeader, getCommunityProfileId } from "../lib/auth";
import { sendSuccess, sendError } from "../middleware";

const router = Router();

/**
 * GET /api/notifications
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const auth = getAuthHeader(req);
    if (auth.error) {
      return sendError(res, auth.error, 401);
    }

    const { type } = req.query;
    const communityProfileId = await getCommunityProfileId(auth.userId!);

    let query = supabase
      .from("notifications")
      .select(
        "*, actor:community_profiles!actor_id(display_name, username, avatar_url)"
      )
      .eq("recipient_id", communityProfileId);

    if (type && type !== "all") {
      query = query.eq("type", type);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;

    sendSuccess(res, data, 200);
  } catch (error: any) {
    sendError(res, error.message || "Failed to fetch notifications", 400);
  }
});

interface UpdateNotificationRequest {
  read?: boolean;
}

/**
 * PUT /api/notifications/:id
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const auth = getAuthHeader(req);
    if (auth.error) {
      return sendError(res, auth.error, 401);
    }

    const { id } = req.params;
    const body = req.body as UpdateNotificationRequest;

    const communityProfileId = await getCommunityProfileId(auth.userId!);

    const { data, error } = await supabase
      .from("notifications")
      .update(body)
      .eq("id", id)
      .eq("recipient_id", communityProfileId)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      return sendError(res, "Notification not found or unauthorized", 403);
    }

    sendSuccess(res, data, 200);
  } catch (error: any) {
    sendError(res, error.message || "Failed to update notification", 400);
  }
});

/**
 * DELETE /api/notifications/:id
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const auth = getAuthHeader(req);
    if (auth.error) {
      return sendError(res, auth.error, 401);
    }

    const { id } = req.params;
    const communityProfileId = await getCommunityProfileId(auth.userId!);

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id)
      .eq("recipient_id", communityProfileId);

    if (error) throw error;

    sendSuccess(res, { message: "Notification deleted successfully" }, 200);
  } catch (error: any) {
    sendError(res, error.message || "Failed to delete notification", 400);
  }
});

export default router;
