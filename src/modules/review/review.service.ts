import prisma from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import type { CreateReviewInput } from "./review.validation";

export async function createReview(customerId: string, input: CreateReviewInput) {
    const booking = await prisma.booking.findUnique({
        where: { id: input.bookingId },
        include: { review: true },
    });

    if (!booking) {
        throw new AppError(404, "Booking not found");
    }

    if (booking.customerId !== customerId) {
        throw new AppError(403, "Forbidden - This is not your booking");
    }

    if (booking.status !== "COMPLETED") {
        throw new AppError(400, "You can only review a completed job");
    }

    if (booking.review) {
        throw new AppError(409, "You have already reviewed this booking");
    }

    const technician = await prisma.technicianProfile.findUnique({
        where: { id: booking.technicianId },
        select: { rating: true, reviewCount: true },
    });

    if (!technician) {
        throw new AppError(404, "Technician not found");
    }

    // Fold the new score into the running average rather than re-reading every
    // review, and write both rows together so the cached rating can never drift
    // away from the reviews it summarises.
    const reviewCount = technician.reviewCount + 1;
    const rating =
        (technician.rating * technician.reviewCount + input.rating) / reviewCount;

    const [review] = await prisma.$transaction([
        prisma.review.create({
            data: {
                bookingId: booking.id,
                customerId,
                technicianId: booking.technicianId,
                rating: input.rating,
                comment: input.comment ?? null,
            },
            include: { customer: { select: { id: true, name: true } } },
        }),
        prisma.technicianProfile.update({
            where: { id: booking.technicianId },
            data: { rating: Number(rating.toFixed(2)), reviewCount },
        }),
    ]);

    return review;
}

export function listReviewsForTechnician(technicianId: string) {
    return prisma.review.findMany({
        where: { technicianId },
        include: {
            customer: { select: { id: true, name: true } },
            booking: { select: { id: true, service: { select: { title: true } } } },
        },
        orderBy: { createdAt: "desc" },
    });
}
