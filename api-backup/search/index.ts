import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase";
import { getAuthHeader } from "../lib/auth";
import { sendSuccess, sendError } from "../middleware";

const router = Router();

/**
 * GET /api/search
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const auth = getAuthHeader(req);
    if (auth.error) {
      return sendError(res, auth.error, 401);
    }

    const { q } = req.query;
    const query = (q as string) || "";

    if (!query) {
      return sendSuccess(res, [], 200);
    }

    const { data, error } = await supabase
      .from("community_profiles")
      .select("id, display_name, username, avatar_url")
      .or(`display_name.ilike.%${query}%, username.ilike.%${query}%`);

    if (error) throw error;

    sendSuccess(res, data, 200);
  } catch (error: any) {
    sendError(res, error.message || "Search failed", 400);
  }
});

export default router;
