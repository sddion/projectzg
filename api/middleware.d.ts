import { Response } from "express";
/**
 * CORS headers configuration
 */
export declare const CORS_HEADERS: {
    "Access-Control-Allow-Origin": string;
    "Access-Control-Allow-Methods": string;
    "Access-Control-Allow-Headers": string;
    "Access-Control-Allow-Credentials": string;
};
/**
 * Send JSON error response
 */
export declare function sendError(res: Response, message: string, status?: number): void;
/**
 * Send JSON success response
 */
export declare function sendSuccess(res: Response, data: any, status?: number): void;
