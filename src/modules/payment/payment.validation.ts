import { z } from "zod";

export const createPaymentSchema = z.object({
    bookingId: z.uuid("invalid booking id"),
});

export const paymentIdParamSchema = z.object({
    id: z.uuid("invalid payment id"),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
