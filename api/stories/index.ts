import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase";
import { getAuthHeader, getCommunityProfileId } from "../lib/auth";
import { sendSuccess, sendError } from "../middleware";

const router = Router();

/**
 * GET /api/stories
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const auth = getAuthHeader(req);
    if (auth.error) {
      return sendError(res, auth.error, 401);
    }

    const communityProfileId = await getCommunityProfileId(auth.userId!);

    const { data, error } = await supabase
      .from("stories")
      .select("*, community_profiles(display_name, username, avatar_url)")
      .eq("author_id", communityProfileId)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) throw error;

    sendSuccess(res, data, 200);
  } catch (error: any) {
    sendError(res, error.message || "Failed to fetch stories", 400);
  }
});

interface CreateStoryRequest {
  image_url: string;
  expires_in_hours?: number;
}

/**
 * POST /api/stories
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const auth = getAuthHeader(req);
    if (auth.error) {
      return sendError(res, auth.error, 401);
    }

    const { image_url, expires_in_hours = 24 } = req.body as CreateStoryRequest;

    if (!image_url) {
      return sendError(res, "image_url is required", 400);
    }

    const author_id = await getCommunityProfileId(auth.userId!);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expires_in_hours);

    const { data, error } = await supabase
      .from("stories")
      .insert([
        {
          author_id,
          image_url,
          expires_at: expiresAt.toISOString(),
        },
      ])
      .select();

    if (error) throw error;

    sendSuccess(res, data, 201);
  } catch (error: any) {
    sendError(res, error.message || "Failed to create story", 400);
  }
});

/**
 * GET /api/stories/following
 */
router.get("/following", async (req: Request, res: Response) => {
  try {
    const auth = getAuthHeader(req);
    if (auth.error) {
      return sendError(res, auth.error, 401);
    }

    const communityProfileId = await getCommunityProfileId(auth.userId!);

    const { data: follows, error: followsError } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", communityProfileId);

    if (followsError) throw followsError;

    const followedIds = follows?.map((f) => f.following_id) || [];

    const { data, error } = await supabase
      .from("stories")
      .select("*, community_profiles(display_name, username, avatar_url)")
      .in(
        "author_id",
        followedIds.length > 0 ? followedIds : ["00000000-0000-0000-0000-000000000000"]
      )
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) throw error;

    sendSuccess(res, data, 200);
  } catch (error: any) {
    sendError(res, error.message || "Failed to fetch stories", 400);
  }
});

/**
 * GET /api/stories/views
 */
router.get("/views", async (req: Request, res: Response) => {
  try {
    const auth = getAuthHeader(req);
    if (auth.error) {
      return sendError(res, auth.error, 401);
    }

    const { story_id } = req.query;

    if (!story_id) {
      return sendError(res, "story_id is required", 400);
    }

    const { data, error } = await supabase
      .from("story_views")
      .select("*, users(email, display_name, avatar_url)")
      .eq("story_id", story_id)
      .order("viewed_at", { ascending: false });

    if (error) throw error;

    sendSuccess(res, data, 200);
  } catch (error: any) {
    sendError(res, error.message || "Failed to fetch story views", 400);
  }
});

interface MarkStoryViewedRequest {
  story_id: string;
}

/**
 * POST /api/stories/views
 */
router.post("/views", async (req: Request, res: Response) => {
  try {
    const auth = getAuthHeader(req);
    if (auth.error) {
      return sendError(res, auth.error, 401);
    }

    const { story_id } = req.body as MarkStoryViewedRequest;

    if (!story_id) {
      return sendError(res, "story_id is required", 400);
    }

    const viewer_id = auth.userId!;

    const { data, error } = await supabase
      .from("story_views")
      .insert([{ story_id, viewer_id }])
      .select();

    if (error) {
      if (error.code === "23505") {
        return sendSuccess(res, { message: "View already recorded" }, 200);
      }
      throw error;
    }

    sendSuccess(res, data, 201);
  } catch (error: any) {
    sendError(res, error.message || "Failed to mark story as viewed", 400);
  }
});

/**
 * DELETE /api/stories
 */
router.delete("/", async (req: Request, res: Response) => {
  try {
    const auth = getAuthHeader(req);
    if (auth.error) {
      return sendError(res, auth.error, 401);
    }

    const { story_id } = req.query;

    if (!story_id) {
      return sendError(res, "story_id is required", 400);
    }

    const author_id = await getCommunityProfileId(auth.userId!);

    const { error } = await supabase
      .from("stories")
      .delete()
      .eq("id", story_id)
      .eq("author_id", author_id);

    if (error) throw error;

    sendSuccess(res, { message: "Story deleted successfully" }, 200);
  } catch (error: any) {
    sendError(res, error.message || "Failed to delete story", 400);
  }
});

export default router;
