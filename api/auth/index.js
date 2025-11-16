"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
/**
 * POST /api/auth/signup
 */
router.post("/signup", async (req, res) => {
    try {
        const { email, password, display_name } = req.body;
        if (!email || !password || !display_name) {
            return (0, middleware_1.sendError)(res, "Missing required fields", 400);
        }
        const { data, error } = await supabase_1.supabase.auth.signUp({
            email,
            password,
            options: { data: { display_name } },
        });
        if (error)
            throw error;
        (0, middleware_1.sendSuccess)(res, { user: data.user }, 201);
    }
    catch (error) {
        (0, middleware_1.sendError)(res, error.message || "Signup failed", 400);
    }
});
/**
 * POST /api/auth/signin
 */
router.post("/signin", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return (0, middleware_1.sendError)(res, "Missing required fields", 400);
        }
        const { data, error } = await supabase_1.supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error)
            throw error;
        (0, middleware_1.sendSuccess)(res, { session: data.session }, 200);
    }
    catch (error) {
        (0, middleware_1.sendError)(res, error.message || "Login failed", 400);
    }
});
/**
 * POST /api/auth/signout
 */
router.post("/signout", async (req, res) => {
    try {
        const { error } = await supabase_1.supabase.auth.signOut();
        if (error)
            throw error;
        (0, middleware_1.sendSuccess)(res, { message: "Signed out" }, 200);
    }
    catch (error) {
        (0, middleware_1.sendError)(res, error.message || "Signout failed", 400);
    }
});
/**
 * POST /api/auth/reset-password
 */
router.post("/reset-password", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return (0, middleware_1.sendError)(res, "Email is required", 400);
        }
        const { error } = await supabase_1.supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/change-password`,
        });
        if (error)
            throw error;
        (0, middleware_1.sendSuccess)(res, { message: "Password reset email sent" }, 200);
    }
    catch (error) {
        (0, middleware_1.sendError)(res, error.message || "Failed to send reset email", 400);
    }
});
exports.default = router;
