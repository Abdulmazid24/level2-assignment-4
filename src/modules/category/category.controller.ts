import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import {
    categoryIdParamSchema,
    createCategorySchema,
    updateCategorySchema,
} from "./category.validation";
import {
    createCategory,
    deleteCategory,
    listCategories,
    updateCategory,
} from "./category.service";

export const getCategories = catchAsync(async (_req: Request, res: Response) => {
    const categories = await listCategories();

    sendResponse(res, {
        message: "Categories retrieved successfully",
        data: { categories },
    });
});

export const addCategory = catchAsync(async (req: Request, res: Response) => {
    const input = createCategorySchema.parse(req.body);

    const category = await createCategory(input);

    sendResponse(
        res,
        { message: "Category created successfully", data: { category } },
        201,
    );
});

export const editCategory = catchAsync(async (req: Request, res: Response) => {
    const { id } = categoryIdParamSchema.parse(req.params);
    const input = updateCategorySchema.parse(req.body);

    const category = await updateCategory(id, input);

    sendResponse(res, {
        message: "Category updated successfully",
        data: { category },
    });
});

export const removeCategory = catchAsync(async (req: Request, res: Response) => {
    const { id } = categoryIdParamSchema.parse(req.params);

    await deleteCategory(id);

    sendResponse(res, { message: "Category deleted successfully" });
});
