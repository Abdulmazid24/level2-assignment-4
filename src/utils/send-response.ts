import type { Response } from "express";

export function sendResponse<T>(
    res: Response,
    { message, data }: { message: string; data?: T },
    status: number = 200
) {
    res.status(status).json({
        success: true,
        message,
        data: data ?? null,
    });
}