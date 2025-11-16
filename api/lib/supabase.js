"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseAdmin = exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.warn("Missing Supabase environment variables. API may not work correctly.");
}
// Regular client with service role key for backend operations
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceRoleKey);
// Admin client for admin operations (like deleting users)
exports.supabaseAdmin = supabaseServiceRoleKey
    ? (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
    : null;
