import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase";
import { getAuthHeader, getCommunityProfileId } from "../lib/auth";
import { sendSuccess, sendError } from "../middleware";

const router = Router();

interface CreatePostRequest {
  content: string;
  image_url?: string;
}

/**
 * GET /api/posts
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*, community_profiles(display_name, username, avatar_url)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    sendSuccess(res, data, 200);
  } catch (error: any) {
    sendError(res, error.message || "Failed to fetch posts", 400);
  }
});

/**
 * POST /api/posts
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const auth = getAuthHeader(req);
    if (auth.error) {
      return sendError(res, auth.error, 401);
    }

    const { content, image_url } = req.body as CreatePostRequest;

    if (!content) {
      return sendError(res, "Content is required", 400);
    }

    const author_id = await getCommunityProfileId(auth.userId!);

    const { data, error } = await supabase
      .from("posts")
      .insert([{ author_id, content, image_url }])
      .select();

    if (error) throw error;

    sendSuccess(res, data, 201);
  } catch (error: any) {
    sendError(res, error.message || "Failed to create post", 400);
  }
});

/**
 * GET /api/posts/following
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
      .from("posts")
      .select("*, community_profiles(display_name, username, avatar_url)")
      .in(
        "author_id",
        followedIds.length > 0 ? followedIds : ["00000000-0000-0000-0000-000000000000"]
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    sendSuccess(res, data, 200);
  } catch (error: any) {
    sendError(res, error.message || "Failed to fetch posts", 400);
  }
});

/**
 * GET /api/posts/:id
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("posts")
      .select("*, community_profiles(display_name, username, avatar_url)")
      .eq("id", id)
      .single();

    if (error) throw error;

    sendSuccess(res, data, 200);
  } catch (error: any) {
    sendError(res, error.message || "Post not found", 404);
  }
});

interface UpdatePostRequest {
  content?: string;
  image_url?: string;
}

/**
 * PUT /api/posts/:id
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const auth = getAuthHeader(req);
    if (auth.error) {
      return sendError(res, auth.error, 401);
    }

    const { id } = req.params;
    const body = req.body as UpdatePostRequest;

    const author_id = await getCommunityProfileId(auth.userId!);

    const { data, error } = await supabase
      .from("posts")
      .update(body)
      .eq("id", id)
      .eq("author_id", author_id)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      return sendError(res, "Post not found or unauthorized", 403);
    }

    sendSuccess(res, data, 200);
  } catch (error: any) {
    sendError(res, error.message || "Failed to update post", 400);
  }
});

/**
 * DELETE /api/posts/:id
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const auth = getAuthHeader(req);
    if (auth.error) {
      return sendError(res, auth.error, 401);
    }

    const { id } = req.params;
    const author_id = await getCommunityProfileId(auth.userId!);

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", id)
      .eq("author_id", author_id);

    if (error) throw error;

    sendSuccess(res, { message: "Post deleted successfully" }, 200);
  } catch (error: any) {
    sendError(res, error.message || "Failed to delete post", 400);
  }
});

export default router;
