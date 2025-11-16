"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthHeader = getAuthHeader;
exports.getCommunityProfileId = getCommunityProfileId;
const supabase_1 = require("./supabase");
/**
 * Extract and verify JWT token from Authorization header
 */
function getAuthHeader(req) {
    const auth = req.header("Authorization");
    if (!auth?.startsWith("Bearer ")) {
        return { error: "Unauthorized" };
    }
    const token = auth.slice(7);
    try {
        const decoded = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
        return { userId: decoded.sub };
    }
    catch {
        return { error: "Invalid token" };
    }
}
/**
 * Get community profile ID from user ID
 */
async function getCommunityProfileId(userId) {
    const { data, error } = await supabase_1.supabase
        .from("community_profiles")
        .select("id")
        .eq("user_id", userId)
        .single();
    if (error || !data) {
        throw new Error("Community profile not found");
    }
    return data.id;
}
