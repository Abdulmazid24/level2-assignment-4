import { z } from "zod";

export const createReviewSchema = z.object({
    bookingId: z.uuid("invalid booking id"),
    rating: z
        .number()
        .int("rating must be a whole number")
        .min(1, "rating must be between 1 and 5")
        .max(5, "rating must be between 1 and 5"),
    comment: z.string().trim().max(1000).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
