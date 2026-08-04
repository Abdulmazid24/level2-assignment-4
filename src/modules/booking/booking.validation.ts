import { z } from "zod";
import { BookingStatus } from "../../../prisma/generated/prisma/enums";

export const createBookingSchema = z.object({
    serviceId: z.uuid("invalid service id"),
    scheduledAt: z.coerce.date(),
    address: z.string().trim().min(1, "address is required"),
    notes: z.string().trim().max(500).optional(),
});

export const bookingIdParamSchema = z.object({
    id: z.uuid("invalid booking id"),
});

export const bookingFilterSchema = z.object({
    status: z.enum(BookingStatus).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
});

// The transitions a technician drives. Payment moves a booking to PAID on its
// own, and only the customer may CANCEL, so neither is offered here.
export const technicianBookingActionSchema = z.object({
    status: z.enum([
        BookingStatus.ACCEPTED,
        BookingStatus.DECLINED,
        BookingStatus.IN_PROGRESS,
        BookingStatus.COMPLETED,
    ]),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type BookingFilterInput = z.infer<typeof bookingFilterSchema>;
export type TechnicianBookingAction = z.infer<typeof technicianBookingActionSchema>;
