import prisma from "../../lib/prisma";
import { getStripe } from "../../lib/stripe";
import config from "../../config";
import { AppError } from "../../utils/app-error";

const CURRENCY = "usd";

export async function createCheckoutSession(customerId: string, bookingId: string) {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { service: true, payment: true },
    });

    if (!booking) {
        throw new AppError(404, "Booking not found");
    }

    if (booking.customerId !== customerId) {
        throw new AppError(403, "Forbidden - This is not your booking");
    }

    // The technician has to agree to the job before money changes hands.
    if (booking.status !== "ACCEPTED") {
        throw new AppError(
            400,
            `Only an ACCEPTED booking can be paid for; this one is ${booking.status}`,
        );
    }

    if (booking.payment?.status === "COMPLETED") {
        throw new AppError(409, "This booking is already paid");
    }

    const session = await getStripe().checkout.sessions.create({
        mode: "payment",
        metadata: { bookingId: booking.id },
        success_url: `${config.CLIENT_URL}/payment/success`,
        cancel_url: `${config.CLIENT_URL}/payment/cancel`,
        line_items: [
            {
                quantity: 1,
                price_data: {
                    currency: CURRENCY,
                    unit_amount: Math.round(booking.totalPrice * 100),
                    product_data: { name: booking.service.title },
                },
            },
        ],
    });

    await prisma.payment.upsert({
        where: { bookingId: booking.id },
        create: {
            bookingId: booking.id,
            amount: booking.totalPrice,
            transactionId: session.id,
        },
        update: { transactionId: session.id, status: "PENDING" },
    });

    return { checkoutUrl: session.url, sessionId: session.id };
}

export async function completePayment(bookingId: string, transactionId: string) {
    const payment = await prisma.payment.findUnique({ where: { bookingId } });

    // Stripe re-delivers events, so completing twice must be a no-op.
    if (!payment || payment.status === "COMPLETED") return;

    await prisma.$transaction([
        prisma.payment.update({
            where: { bookingId },
            data: {
                status: "COMPLETED",
                transactionId,
                paymentMethod: "card",
                paidAt: new Date(),
            },
        }),
        prisma.booking.update({
            where: { id: bookingId },
            data: { status: "PAID" },
        }),
    ]);
}

export async function failPayment(bookingId: string) {
    await prisma.payment.updateMany({
        where: { bookingId, status: "PENDING" },
        data: { status: "FAILED" },
    });
}

export function listPaymentsForUser(userId: string, role: string) {
    const where =
        role === "ADMIN"
            ? {}
            : role === "TECHNICIAN"
              ? { booking: { technician: { userId } } }
              : { booking: { customerId: userId } };

    return prisma.payment.findMany({
        where,
        include: { booking: { include: { service: true } } },
        orderBy: { createdAt: "desc" },
    });
}

export async function getPaymentForUser(userId: string, role: string, paymentId: string) {
    const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
            booking: {
                include: {
                    service: true,
                    technician: { select: { userId: true } },
                },
            },
        },
    });

    if (!payment) {
        throw new AppError(404, "Payment not found");
    }

    const isCustomer = payment.booking.customerId === userId;
    const isTechnician = payment.booking.technician.userId === userId;

    if (role !== "ADMIN" && !isCustomer && !isTechnician) {
        throw new AppError(403, "Forbidden - This is not your payment");
    }

    return payment;
}
