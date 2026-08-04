import type { Request, Response } from "express";
import { getStripe } from "../../lib/stripe";
import config from "../../config";
import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { AppError } from "../../utils/app-error";
import { createPaymentSchema, paymentIdParamSchema } from "./payment.validation";
import {
    completePayment,
    createCheckoutSession,
    failPayment,
    getPaymentForUser,
    listPaymentsForUser,
} from "./payment.service";

export const createPayment = catchAsync(async (req: Request, res: Response) => {
    const { bookingId } = createPaymentSchema.parse(req.body);

    const result = await createCheckoutSession(req.user!.id, bookingId);

    sendResponse(res, { message: "Checkout session created", data: result }, 201);
});

export const getMyPayments = catchAsync(async (req: Request, res: Response) => {
    const payments = await listPaymentsForUser(req.user!.id, req.user!.role);

    sendResponse(res, {
        message: "Payments retrieved successfully",
        data: { payments },
    });
});

export const getPayment = catchAsync(async (req: Request, res: Response) => {
    const { id } = paymentIdParamSchema.parse(req.params);

    const payment = await getPaymentForUser(req.user!.id, req.user!.role, id);

    sendResponse(res, {
        message: "Payment retrieved successfully",
        data: { payment },
    });
});

export const confirmPayment = catchAsync(async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"];

    if (!signature) {
        throw new AppError(400, "Missing stripe-signature header");
    }

    // Resolved outside the try so a missing-config 503 isn't reported as a bad signature.
    const stripe = getStripe();

    let event;
    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            config.STRIPE_WEBHOOK_SECRET,
        );
    } catch {
        throw new AppError(400, "Invalid webhook signature");
    }

    const session = event.data.object as {
        id: string;
        metadata?: { bookingId?: string };
    };
    const bookingId = session.metadata?.bookingId;

    if (bookingId) {
        switch (event.type) {
            case "checkout.session.completed":
            case "checkout.session.async_payment_succeeded":
                await completePayment(bookingId, session.id);
                break;
            case "checkout.session.expired":
            case "checkout.session.async_payment_failed":
                await failPayment(bookingId);
                break;
        }
    }

    // Always 200 once the signature checks out, otherwise Stripe retries forever.
    res.json({ received: true });
});
