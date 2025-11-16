"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const auth_1 = require("../lib/auth");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
/**
 * GET /api/search
 */
router.get("/", async (req, res) => {
    try {
        const auth = (0, auth_1.getAuthHeader)(req);
        if (auth.error) {
            return (0, middleware_1.sendError)(res, auth.error, 401);
        }
        const { q } = req.query;
        const query = q || "";
        if (!query) {
            return (0, middleware_1.sendSuccess)(res, [], 200);
        }
        const { data, error } = await supabase_1.supabase
            .from("community_profiles")
            .select("id, display_name, username, avatar_url")
            .or(`display_name.ilike.%${query}%, username.ilike.%${query}%`);
        if (error)
            throw error;
        (0, middleware_1.sendSuccess)(res, data, 200);
    }
    catch (error) {
        (0, middleware_1.sendError)(res, error.message || "Search failed", 400);
    }
});
exports.default = router;
