/**
 * Vercel Serverless Function Handler
 * This exports a default handler that Vercel will use for each /api/* request
 *
 * When deployed to Vercel:
 * - Each file in /api becomes a serverless function
 * - GET /api/posts → /api/posts.ts
 * - POST /api/posts → /api/posts.ts
 * - Dynamic routes: /api/posts/[id].ts → /api/posts/:id
 *
 * This handler bridges your existing Express API to Vercel's serverless format
 */
export default function handler(req: any, res: any): Promise<void>;
//# sourceMappingURL=handler.d.ts.map