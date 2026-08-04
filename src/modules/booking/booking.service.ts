import type { BookingStatus } from "../../../prisma/generated/prisma/enums";
import type { Prisma } from "../../../prisma/generated/prisma/client";
import prisma from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import { getTechnicianProfileOrThrow } from "../technician/technician.service";
import type {
    BookingFilterInput,
    CreateBookingInput,
    TechnicianBookingAction,
} from "./booking.validation";

const bookingInclude = {
    service: { include: { category: true } },
    technician: {
        include: { user: { select: { id: true, name: true, email: true, phone: true } } },
    },
    customer: { select: { id: true, name: true, email: true, phone: true } },
    payment: true,
    review: true,
} satisfies Prisma.BookingInclude;

// A technician may only move a booking along these edges. Anything else — say
// completing a job that was never started — is rejected as a bad request.
const TECHNICIAN_TRANSITIONS: Record<string, BookingStatus[]> = {
    REQUESTED: ["ACCEPTED", "DECLINED"],
    PAID: ["IN_PROGRESS"],
    IN_PROGRESS: ["COMPLETED"],
};

export async function createBooking(customerId: string, input: CreateBookingInput) {
    const service = await prisma.service.findUnique({
        where: { id: input.serviceId },
        include: { technician: { include: { user: true } } },
    });

    if (!service) {
        throw new AppError(404, "Service not found");
    }

    if (!service.isActive) {
        throw new AppError(400, "This service is no longer offered");
    }

    if (!service.technician.isAvailable) {
        throw new AppError(400, "This technician is not accepting bookings right now");
    }

    if (service.technician.user.status === "BANNED") {
        throw new AppError(400, "This technician is not available");
    }

    if (service.technician.userId === customerId) {
        throw new AppError(400, "You cannot book your own service");
    }

    const clash = await prisma.booking.findFirst({
        where: {
            technicianId: service.technicianId,
            scheduledAt: input.scheduledAt,
            status: { in: ["REQUESTED", "ACCEPTED", "PAID", "IN_PROGRESS"] },
        },
    });

    if (clash) {
        throw new AppError(409, "The technician is already booked for that time slot");
    }

    return prisma.booking.create({
        data: {
            customerId,
            technicianId: service.technicianId,
            serviceId: service.id,
            scheduledAt: input.scheduledAt,
            address: input.address,
            notes: input.notes ?? null,
            // Priced from the service record rather than the request body, so a
            // client cannot choose what it pays.
            totalPrice: service.price,
        },
        include: bookingInclude,
    });
}

export async function listCustomerBookings(
    customerId: string,
    filters: BookingFilterInput,
) {
    return paginateBookings({ customerId, ...(filters.status && { status: filters.status }) }, filters);
}

export async function listTechnicianBookings(
    userId: string,
    filters: BookingFilterInput,
) {
    const profile = await getTechnicianProfileOrThrow(userId);

    return paginateBookings(
        { technicianId: profile.id, ...(filters.status && { status: filters.status }) },
        filters,
    );
}

export async function getBookingForUser(
    userId: string,
    role: string,
    bookingId: string,
) {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: bookingInclude,
    });

    if (!booking) {
        throw new AppError(404, "Booking not found");
    }

    const isCustomer = booking.customerId === userId;
    const isTechnician = booking.technician.userId === userId;

    if (role !== "ADMIN" && !isCustomer && !isTechnician) {
        throw new AppError(403, "Forbidden - This is not your booking");
    }

    return booking;
}

export async function updateBookingStatusAsTechnician(
    userId: string,
    bookingId: string,
    input: TechnicianBookingAction,
) {
    const profile = await getTechnicianProfileOrThrow(userId);

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

    if (!booking) {
        throw new AppError(404, "Booking not found");
    }

    if (booking.technicianId !== profile.id) {
        throw new AppError(403, "Forbidden - This is not your booking");
    }

    const allowed = TECHNICIAN_TRANSITIONS[booking.status] ?? [];

    if (!allowed.includes(input.status)) {
        throw new AppError(
            400,
            `Cannot move a ${booking.status} booking to ${input.status}`,
        );
    }

    return prisma.booking.update({
        where: { id: bookingId },
        data: { status: input.status },
        include: bookingInclude,
    });
}

export async function cancelBooking(customerId: string, bookingId: string) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

    if (!booking) {
        throw new AppError(404, "Booking not found");
    }

    if (booking.customerId !== customerId) {
        throw new AppError(403, "Forbidden - This is not your booking");
    }

    // The spec allows cancelling any time before work actually starts.
    if (!["REQUESTED", "ACCEPTED", "PAID"].includes(booking.status)) {
        throw new AppError(400, `A ${booking.status} booking can no longer be cancelled`);
    }

    return prisma.booking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED" },
        include: bookingInclude,
    });
}

async function paginateBookings(
    where: Prisma.BookingWhereInput,
    filters: BookingFilterInput,
) {
    const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
            where,
            include: bookingInclude,
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
