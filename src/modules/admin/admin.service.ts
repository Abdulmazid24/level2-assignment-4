import type { Prisma } from "../../../prisma/generated/prisma/client";
import type { UserStatus } from "../../../prisma/generated/prisma/enums";
import prisma from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import type { AdminBookingFilterInput, UserFilterInput } from "./admin.validation";

export async function listUsers(filters: UserFilterInput) {
    const where: Prisma.UserWhereInput = {
        ...(filters.role && { role: filters.role }),
        ...(filters.status && { status: filters.status }),
        ...(filters.search && {
            OR: [
                { name: { contains: filters.search, mode: "insensitive" } },
                { email: { contains: filters.search, mode: "insensitive" } },
            ],
        }),
    };

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            omit: { password: true },
            include: { technicianProfile: true },
            orderBy: { createdAt: "desc" },
            skip: (filters.page - 1) * filters.limit,
            take: filters.limit,
        }),
        prisma.user.count({ where }),
    ]);

    return {
        users,
        meta: {
            page: filters.page,
            limit: filters.limit,
            total,
            totalPages: Math.ceil(total / filters.limit),
        },
    };
}

export async function updateUserStatus(
    adminId: string,
    userId: string,
    status: UserStatus,
) {
    // Without this an admin could ban themselves and lock the platform's only
    // moderator out of their own dashboard.
    if (adminId === userId) {
        throw new AppError(400, "You cannot change your own status");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
        throw new AppError(404, "User not found");
    }

    if (user.role === "ADMIN") {
        throw new AppError(403, "Admin accounts cannot be banned");
    }

    return prisma.user.update({
        where: { id: userId },
        data: { status },
        omit: { password: true },
    });
}

export async function listAllBookings(filters: AdminBookingFilterInput) {
    const where: Prisma.BookingWhereInput = {
        ...(filters.status && { status: filters.status }),
    };

    const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
            where,
            include: {
                service: { include: { category: true } },
                customer: { select: { id: true, name: true, email: true } },
                technician: {
                    include: { user: { select: { id: true, name: true, email: true } } },
                },
                payment: true,
            },
            orderBy: { createdAt: "desc" },
            skip: (filters.page - 1) * filters.limit,
            take: filters.limit,
        }),
        prisma.booking.count({ where }),
    ]);

    return {
        bookings,
        meta: {
            page: filters.page,
            limit: filters.limit,
            total,
            totalPages: Math.ceil(total / filters.limit),
        },
    };
}

export async function getPlatformStats() {
    const [users, technicians, bookings, completedBookings, revenue] = await Promise.all([
        prisma.user.count(),
        prisma.technicianProfile.count(),
        prisma.booking.count(),
        prisma.booking.count({ where: { status: "COMPLETED" } }),
        prisma.payment.aggregate({
            where: { status: "COMPLETED" },
            _sum: { amount: true },
        }),
    ]);

    return {
        users,
        technicians,
        bookings,
        completedBookings,
        totalRevenue: revenue._sum.amount ?? 0,
    };
}
