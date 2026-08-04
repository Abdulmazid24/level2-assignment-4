import prisma from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import { definedFields } from "../../utils/defined-fields";
import type { CreateCategoryInput, UpdateCategoryInput } from "./category.validation";

export function listCategories() {
    return prisma.category.findMany({
        orderBy: { name: "asc" },
        include: { _count: { select: { services: true } } },
    });
}

export function createCategory(input: CreateCategoryInput) {
    return prisma.category.create({
        data: { name: input.name, description: input.description ?? null },
    });
}

export async function updateCategory(id: string, input: UpdateCategoryInput) {
    await getCategoryOrThrow(id);

    return prisma.category.update({ where: { id }, data: definedFields(input) });
}

export async function deleteCategory(id: string) {
    await getCategoryOrThrow(id);

    const servicesInCategory = await prisma.service.count({ where: { categoryId: id } });

    if (servicesInCategory > 0) {
        throw new AppError(
            409,
            `Cannot delete a category that still has ${servicesInCategory} service(s)`,
        );
    }

    return prisma.category.delete({ where: { id } });
}

async function getCategoryOrThrow(id: string) {
    const category = await prisma.category.findUnique({ where: { id } });

    if (!category) {
        throw new AppError(404, "Category not found");
    }

    return category;
}
