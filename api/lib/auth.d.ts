import { Request } from "express";
/**
 * Extract and verify JWT token from Authorization header
 */
export declare function getAuthHeader(req: Request): {
    userId?: string;
    error?: string;
};
/**
 * Get community profile ID from user ID
 */
export declare function getCommunityProfileId(userId: string): Promise<string>;
//# sourceMappingURL=auth.d.ts.map