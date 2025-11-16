/**
 * CORS headers configuration
 */
export const CORS_HEADERS = {
    "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
};
/**
 * Send JSON error response
 */
export function sendError(res, message, status = 400) {
    res.status(status).json({ error: message });
}
/**
 * Send JSON success response
 */
export function sendSuccess(res, data, status = 200) {
    res.status(status).json(data);
}
//# sourceMappingURL=middleware.js.map