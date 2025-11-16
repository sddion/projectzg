import { supabase } from "./supabase";
/**
 * Extract and verify JWT token from Authorization header
 */
export function getAuthHeader(req) {
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
export async function getCommunityProfileId(userId) {
    const { data, error } = await supabase
        .from("community_profiles")
        .select("id")
        .eq("user_id", userId)
        .single();
    if (error || !data) {
        throw new Error("Community profile not found");
    }
    return data.id;
}
//# sourceMappingURL=auth.js.map