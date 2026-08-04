import { z } from "zod";

export const createServiceSchema = z.object({
    title: z.string().trim().min(1, "title is required"),
    description: z.string().trim().optional(),
    price: z.number().positive("price must be greater than 0"),
    categoryId: z.uuid("invalid category id"),
});

export const updateServiceSchema = createServiceSchema.partial().extend({
    isActive: z.boolean().optional(),
});

export const serviceIdParamSchema = z.object({
    id: z.uuid("invalid service id"),
});

export const serviceFilterSchema = z.object({
    category: z.string().trim().optional(),
    location: z.string().trim().optional(),
    search: z.string().trim().optional(),
    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().nonnegative().optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type ServiceFilterInput = z.infer<typeof serviceFilterSchema>;
