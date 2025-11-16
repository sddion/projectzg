"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const auth_1 = require("../lib/auth");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
/**
 * GET /api/notifications
 */
router.get("/", async (req, res) => {
    try {
        const auth = (0, auth_1.getAuthHeader)(req);
        if (auth.error) {
            return (0, middleware_1.sendError)(res, auth.error, 401);
        }
        const { type } = req.query;
        const communityProfileId = await (0, auth_1.getCommunityProfileId)(auth.userId);
        let query = supabase_1.supabase
            .from("notifications")
            .select("*, actor:community_profiles!actor_id(display_name, username, avatar_url)")
            .eq("recipient_id", communityProfileId);
        if (type && type !== "all") {
            query = query.eq("type", type);
        }
        const { data, error } = await query.order("created_at", {
            ascending: false,
        });
        if (error)
            throw error;
        (0, middleware_1.sendSuccess)(res, data, 200);
    }
    catch (error) {
        (0, middleware_1.sendError)(res, error.message || "Failed to fetch notifications", 400);
    }
});
/**
 * PUT /api/notifications/:id
 */
router.put("/:id", async (req, res) => {
    try {
        const auth = (0, auth_1.getAuthHeader)(req);
        if (auth.error) {
            return (0, middleware_1.sendError)(res, auth.error, 401);
        }
        const { id } = req.params;
        const body = req.body;
        const communityProfileId = await (0, auth_1.getCommunityProfileId)(auth.userId);
        const { data, error } = await supabase_1.supabase
            .from("notifications")
            .update(body)
            .eq("id", id)
            .eq("recipient_id", communityProfileId)
            .select();
        if (error)
            throw error;
        if (!data || data.length === 0) {
            return (0, middleware_1.sendError)(res, "Notification not found or unauthorized", 403);
        }
        (0, middleware_1.sendSuccess)(res, data, 200);
    }
    catch (error) {
        (0, middleware_1.sendError)(res, error.message || "Failed to update notification", 400);
    }
});
/**
 * DELETE /api/notifications/:id
 */
router.delete("/:id", async (req, res) => {
    try {
        const auth = (0, auth_1.getAuthHeader)(req);
        if (auth.error) {
            return (0, middleware_1.sendError)(res, auth.error, 401);
        }
        const { id } = req.params;
        const communityProfileId = await (0, auth_1.getCommunityProfileId)(auth.userId);
        const { error } = await supabase_1.supabase
            .from("notifications")
            .delete()
            .eq("id", id)
            .eq("recipient_id", communityProfileId);
        if (error)
            throw error;
        (0, middleware_1.sendSuccess)(res, { message: "Notification deleted successfully" }, 200);
    }
    catch (error) {
        (0, middleware_1.sendError)(res, error.message || "Failed to delete notification", 400);
    }
});
exports.default = router;
