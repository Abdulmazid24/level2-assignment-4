import type { Prisma } from "../../../prisma/generated/prisma/client";
import prisma from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import { definedFields } from "../../utils/defined-fields";
import { getTechnicianProfileOrThrow } from "../technician/technician.service";
import type {
    CreateServiceInput,
    ServiceFilterInput,
    UpdateServiceInput,
} from "./service.validation";

const publicServiceInclude = {
    category: true,
    technician: {
        include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
        },
    },
} satisfies Prisma.ServiceInclude;

export async function listServices(filters: ServiceFilterInput) {
    const where: Prisma.ServiceWhereInput = {
        isActive: true,
        ...(filters.category && {
            category: { name: { equals: filters.category, mode: "insensitive" } },
        }),
        ...(filters.location && {
            technician: { location: { contains: filters.location, mode: "insensitive" } },
        }),
        ...(filters.minRating !== undefined && {
            technician: { rating: { gte: filters.minRating } },
        }),
        ...(filters.search && {
            OR: [
                { title: { contains: filters.search, mode: "insensitive" } },
                { description: { contains: filters.search, mode: "insensitive" } },
            ],
        }),
        ...((filters.minPrice !== undefined || filters.maxPrice !== undefined) && {
            price: {
                ...(filters.minPrice !== undefined && { gte: filters.minPrice }),
                ...(filters.maxPrice !== undefined && { lte: filters.maxPrice }),
            },
        }),
    };

    // location and minRating both narrow `technician`, so merge them by hand —
    // spreading twice would silently drop the first one.
    if (filters.location && filters.minRating !== undefined) {
        where.technician = {
            location: { contains: filters.location, mode: "insensitive" },
            rating: { gte: filters.minRating },
        };
    }

    const [services, total] = await Promise.all([
        prisma.service.findMany({
            where,
            include: publicServiceInclude,
            orderBy: { createdAt: "desc" },
            skip: (filters.page - 1) * filters.limit,
            take: filters.limit,
        }),
        prisma.service.count({ where }),
    ]);

    return {
        services,
        meta: {
            page: filters.page,
            limit: filters.limit,
            total,
            totalPages: Math.ceil(total / filters.limit),
        },
    };
}

export async function getServiceById(id: string) {
    const service = await prisma.service.findUnique({
        where: { id },
        include: publicServiceInclude,
    });

    if (!service) {
        throw new AppError(404, "Service not found");
    }

    return service;
}

export async function createService(userId: string, input: CreateServiceInput) {
    const profile = await getTechnicianProfileOrThrow(userId);

    const category = await prisma.category.findUnique({
        where: { id: input.categoryId },
    });

    if (!category) {
        throw new AppError(404, "Category not found");
    }

    return prisma.service.create({
        data: {
            title: input.title,
            description: input.description ?? null,
            price: input.price,
            categoryId: input.categoryId,
            technicianId: profile.id,
        },
        include: { category: true },
    });
}

export async function updateService(
    userId: string,
    serviceId: string,
    input: UpdateServiceInput,
) {
    await assertOwnsService(userId, serviceId);

    if (input.categoryId) {
        const category = await prisma.category.findUnique({
            where: { id: input.categoryId },
        });

        if (!category) {
            throw new AppError(404, "Category not found");
        }
    }

    return prisma.service.update({
        where: { id: serviceId },
        data: definedFields(input),
        include: { category: true },
    });
}

export async function deleteService(userId: string, serviceId: string) {
    await assertOwnsService(userId, serviceId);

    const activeBookings = await prisma.booking.count({
        where: {
            serviceId,
            status: { in: ["REQUESTED", "ACCEPTED", "PAID", "IN_PROGRESS"] },
        },
    });

    if (activeBookings > 0) {
        throw new AppError(
            409,
            "Cannot delete a service with bookings still in progress. Deactivate it instead.",
        );
    }

    return prisma.service.delete({ where: { id: serviceId } });
}

export async function listOwnServices(userId: string) {
    const profile = await getTechnicianProfileOrThrow(userId);

    return prisma.service.findMany({
        where: { technicianId: profile.id },
        include: { category: true },
        orderBy: { createdAt: "desc" },
    });
}

async function assertOwnsService(userId: string, serviceId: string) {
    const profile = await getTechnicianProfileOrThrow(userId);

    const service = await prisma.service.findUnique({ where: { id: serviceId } });

    if (!service) {
        throw new AppError(404, "Service not found");
    }

    if (service.technicianId !== profile.id) {
        throw new AppError(403, "Forbidden - This is not your service");
    }

    return service;
}
