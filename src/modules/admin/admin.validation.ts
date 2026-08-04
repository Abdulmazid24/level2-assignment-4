import { z } from "zod";
import { Role, UserStatus } from "../../../prisma/generated/prisma/enums";
import { BookingStatus } from "../../../prisma/generated/prisma/enums";

export const userIdParamSchema = z.object({
    id: z.uuid("invalid user id"),
});

export const updateUserStatusSchema = z.object({
    status: z.enum(UserStatus),
});

export const userFilterSchema = z.object({
    role: z.enum(Role).optional(),
    status: z.enum(UserStatus).optional(),
    search: z.string().trim().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
});

export const adminBookingFilterSchema = z.object({
    status: z.enum(BookingStatus).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
});

export type UserFilterInput = z.infer<typeof userFilterSchema>;
export type AdminBookingFilterInput = z.infer<typeof adminBookingFilterSchema>;
