import bcrypt from "bcryptjs";
import prisma from "../../lib/prisma";
import { createTokenPair, type UserJwtPayload } from "../../utils/jwt";
import { AppError } from "../../utils/app-error";
import { definedFields } from "../../utils/defined-fields";
import type { RegisterInput, LoginInput, UpdateMeInput } from "./auth.validation";

function toJwtPayload(user: {
    id: string;
    email: string;
    role: UserJwtPayload["role"];
}): UserJwtPayload {
    return { id: user.id, email: user.email, role: user.role };
}

export async function registerUser(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
    });

    if (existingUser) {
        throw new AppError(409, "Email already exists");
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);

    return prisma.user.create({
        data: {
            name: input.name,
            email: input.email,
            password: hashedPassword,
            phone: input.phone ?? null,
            role: input.role,
        },
        omit: { password: true },
    });
}

export async function loginUser(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });

    if (!user) {
        throw new AppError(401, "Invalid email or password");
    }

    const passwordMatches = await bcrypt.compare(input.password, user.password);

    if (!passwordMatches) {
        throw new AppError(401, "Invalid email or password");
    }

    if (user.status === "BANNED") {
        throw new AppError(403, "Your account has been banned. Contact support.");
    }

    const safeUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };

    return {
        user: safeUser,
        ...createTokenPair(toJwtPayload(user)),
    };
}

export async function getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        omit: { password: true },
        include: { technicianProfile: true },
    });

    if (!user) {
        throw new AppError(404, "User not found");
    }

    return user;
}

export async function updateCurrentUser(userId: string, input: UpdateMeInput) {
    return prisma.user.update({
        where: { id: userId },
        data: definedFields(input),
        omit: { password: true },
        include: { technicianProfile: true },
    });
}
