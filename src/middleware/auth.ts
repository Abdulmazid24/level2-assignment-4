import type { NextFunction, Request, Response } from "express";
import { catchAsync } from "../utils/catch-async";
import type { Role } from "../../prisma/generated/prisma/enums";
import { verifyAccessToken } from "../utils/jwt";
import { AppError } from "../utils/app-error";
import prisma from "../lib/prisma";

const auth = (...roles: Role[]) =>
    catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new AppError(401, "Unauthorized - No token provided");
        }

        const token = authHeader.slice(7);

        let decoded;
        try {
            decoded = verifyAccessToken(token);
        } catch {
            throw new AppError(401, "Unauthorized - Invalid or expired token");
        }

        // Hit the database on every request so a ban takes effect immediately
        // instead of waiting for the user's existing token to expire.
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, status: true, role: true },
        });

        if (!user) {
            throw new AppError(401, "Unauthorized - User no longer exists");
        }

        if (user.status === "BANNED") {
            throw new AppError(403, "Your account has been banned. Contact support.");
        }

        if (roles.length && !roles.includes(user.role)) {
            throw new AppError(403, "Forbidden - Unauthorized access");
        }

        req.user = { ...decoded, role: user.role };
        next();
    });

export default auth;
