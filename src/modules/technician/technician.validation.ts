import { z } from "zod";
import { Weekday } from "../../../prisma/generated/prisma/enums";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export const updateProfileSchema = z.object({
    bio: z.string().trim().max(1000).optional(),
    skills: z.array(z.string().trim().min(1)).optional(),
    experienceYears: z.number().int().min(0, "experienceYears cannot be negative").optional(),
    hourlyRate: z.number().positive("hourlyRate must be greater than 0").optional(),
    location: z.string().trim().min(1, "location is required").optional(),
    isAvailable: z.boolean().optional(),
});

const slotSchema = z
    .object({
        weekday: z.enum(Weekday),
        startTime: z.string().regex(TIME_PATTERN, "startTime must be HH:MM"),
        endTime: z.string().regex(TIME_PATTERN, "endTime must be HH:MM"),
    })
    .refine((slot) => slot.endTime > slot.startTime, {
        message: "endTime must be after startTime",
        path: ["endTime"],
    });

export const updateAvailabilitySchema = z.object({
    slots: z.array(slotSchema).max(50, "at most 50 slots are allowed"),
});

export const technicianIdParamSchema = z.object({
    id: z.uuid("invalid technician id"),
});

export const technicianFilterSchema = z.object({
    location: z.string().trim().optional(),
    search: z.string().trim().optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    maxHourlyRate: z.coerce.number().positive().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
export type TechnicianFilterInput = z.infer<typeof technicianFilterSchema>;
