import { Router } from "express";
import authRoutes from "./auth/index";
import postsRoutes from "./posts/index";
import commentsRoutes from "./comments/index";
import profileRoutes from "./profile/index";
import likesRoutes from "./likes/index";
import followsRoutes from "./follows/index";
import storiesRoutes from "./stories/index";
import notificationsRoutes from "./notifications/index";
import searchRoutes from "./search/index";
import savedPostsRoutes from "./saved-posts/index";
/**
 * Create Express.js API router
 * Mounts all API route handlers
 */
export function createApiRouter() {
    const router = Router();
    // Health check
    router.get("/health", (req, res) => {
        res.json({ status: "ok", timestamp: new Date().toISOString() });
    });
    // Mount API routes
    router.use("/auth", authRoutes);
    router.use("/posts", postsRoutes);
    router.use("/comments", commentsRoutes);
    router.use("/profile", profileRoutes);
    router.use("/likes", likesRoutes);
    router.use("/follows", followsRoutes);
    router.use("/stories", storiesRoutes);
    router.use("/notifications", notificationsRoutes);
    router.use("/search", searchRoutes);
    router.use("/saved-posts", savedPostsRoutes);
    return router;
}
export default createApiRouter;
//# sourceMappingURL=express-adapter.js.map