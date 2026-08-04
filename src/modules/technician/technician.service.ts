import type { Prisma } from "../../../prisma/generated/prisma/client";
import prisma from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import { definedFields } from "../../utils/defined-fields";
import type {
    TechnicianFilterInput,
    UpdateAvailabilityInput,
    UpdateProfileInput,
} from "./technician.validation";

const DEFAULT_HOURLY_RATE = 0;

export async function getTechnicianProfileOrThrow(userId: string) {
    const profile = await prisma.technicianProfile.findUnique({ where: { userId } });

    if (!profile) {
        throw new AppError(404, "Technician profile not found. Create it first.");
    }

    return profile;
}

// PUT semantics: the first call creates the profile, later calls patch it. A
// technician signs up before they have any profile details to submit.
export async function upsertTechnicianProfile(
    userId: string,
    input: UpdateProfileInput,
) {
    const existing = await prisma.technicianProfile.findUnique({ where: { userId } });

    if (!existing && !input.location) {
        throw new AppError(400, "location is required when creating your profile");
    }

    return prisma.technicianProfile.upsert({
        where: { userId },
        create: {
            userId,
            bio: input.bio ?? null,
            skills: input.skills ?? [],
            experienceYears: input.experienceYears ?? 0,
            hourlyRate: input.hourlyRate ?? DEFAULT_HOURLY_RATE,
            location: input.location!,
            isAvailable: input.isAvailable ?? true,
        },
        update: definedFields(input),
        include: { availability: true, services: { include: { category: true } } },
    });
}

export async function replaceAvailability(
    userId: string,
    input: UpdateAvailabilityInput,
) {
    const profile = await getTechnicianProfileOrThrow(userId);

    const duplicate = findDuplicateSlot(input.slots);
    if (duplicate) {
        throw new AppError(400, `Duplicate slot for ${duplicate.weekday} at ${duplicate.startTime}`);
    }

    // The endpoint replaces the whole week, so clear and re-insert atomically:
    // a partial write would leave the technician bookable at the wrong hours.
    await prisma.$transaction([
        prisma.availabilitySlot.deleteMany({ where: { technicianId: profile.id } }),
        prisma.availabilitySlot.createMany({
            data: input.slots.map((slot) => ({ ...slot, technicianId: profile.id })),
        }),
    ]);

    return prisma.availabilitySlot.findMany({
        where: { technicianId: profile.id },
        orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
    });
}

export async function listTechnicians(filters: TechnicianFilterInput) {
    const where: Prisma.TechnicianProfileWhereInput = {
        user: { status: "ACTIVE" },
        ...(filters.location && {
            location: { contains: filters.location, mode: "insensitive" },
        }),
        ...(filters.minRating !== undefined && { rating: { gte: filters.minRating } }),
        ...(filters.maxHourlyRate !== undefined && {
            hourlyRate: { lte: filters.maxHourlyRate },
        }),
        ...(filters.search && {
            OR: [
                { bio: { contains: filters.search, mode: "insensitive" } },
                { skills: { has: filters.search } },
                { user: { name: { contains: filters.search, mode: "insensitive" } } },
            ],
        }),
    };

    const [technicians, total] = await Promise.all([
        prisma.technicianProfile.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, email: true, phone: true } },
                services: { where: { isActive: true }, include: { category: true } },
            },
            orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
            skip: (filters.page - 1) * filters.limit,
            take: filters.limit,
        }),
        prisma.technicianProfile.count({ where }),
    ]);

    return {
        technicians,
        meta: {
            page: filters.page,
            limit: filters.limit,
            total,
            totalPages: Math.ceil(total / filters.limit),
        },
    };
}

export async function getTechnicianById(id: string) {
    const technician = await prisma.technicianProfile.findUnique({
        where: { id },
        include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
            services: { where: { isActive: true }, include: { category: true } },
            availability: { orderBy: [{ weekday: "asc" }, { startTime: "asc" }] },
            reviews: {
                include: { customer: { select: { id: true, name: true } } },
                orderBy: { createdAt: "desc" },
            },
        },
    });

    if (!technician) {
        throw new AppError(404, "Technician not found");
    }

    return technician;
}

function findDuplicateSlot(slots: UpdateAvailabilityInput["slots"]) {
    const seen = new Set<string>();

    for (const slot of slots) {
        const key = `${slot.weekday}-${slot.startTime}`;
        if (seen.has(key)) return slot;
        seen.add(key);
    }

    return null;
}
