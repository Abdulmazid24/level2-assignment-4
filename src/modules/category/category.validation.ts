import { z } from "zod";

export const createCategorySchema = z.object({
    name: z.string().trim().min(1, "name is required"),
    description: z.string().trim().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const categoryIdParamSchema = z.object({
    id: z.uuid("invalid category id"),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
