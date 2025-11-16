import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase";
import { sendSuccess, sendError } from "../middleware";

const router = Router();

interface SignUpRequest {
  email: string;
  password: string;
  display_name: string;
}

/**
 * POST /api/auth/signup
 */
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { email, password, display_name } = req.body as SignUpRequest;

    if (!email || !password || !display_name) {
      return sendError(res, "Missing required fields", 400);
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name } },
    });

    if (error) throw error;

    sendSuccess(res, { user: data.user }, 201);
  } catch (error: any) {
    sendError(res, error.message || "Signup failed", 400);
  }
});

interface SignInRequest {
  email: string;
  password: string;
}

/**
 * POST /api/auth/signin
 */
router.post("/signin", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as SignInRequest;

    if (!email || !password) {
      return sendError(res, "Missing required fields", 400);
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    sendSuccess(res, { session: data.session }, 200);
  } catch (error: any) {
    sendError(res, error.message || "Login failed", 400);
  }
});

/**
 * POST /api/auth/signout
 */
router.post("/signout", async (req: Request, res: Response) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    sendSuccess(res, { message: "Signed out" }, 200);
  } catch (error: any) {
    sendError(res, error.message || "Signout failed", 400);
  }
});

interface ResetPasswordRequest {
  email: string;
}

/**
 * POST /api/auth/reset-password
 */
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body as ResetPasswordRequest;

    if (!email) {
      return sendError(res, "Email is required", 400);
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/change-password`,
    });

    if (error) throw error;

    sendSuccess(res, { message: "Password reset email sent" }, 200);
  } catch (error: any) {
    sendError(res, error.message || "Failed to send reset email", 400);
  }
});

export default router;
