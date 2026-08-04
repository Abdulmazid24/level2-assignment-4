import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { createReviewSchema } from "./review.validation";
import { createReview, listReviewsForTechnician } from "./review.service";
import { technicianIdParamSchema } from "../technician/technician.validation";

export const addReview = catchAsync(async (req: Request, res: Response) => {
    const input = createReviewSchema.parse(req.body);

    const review = await createReview(req.user!.id, input);

    sendResponse(
        res,
        { message: "Review submitted successfully", data: { review } },
        201,
    );
});

export const getTechnicianReviews = catchAsync(async (req: Request, res: Response) => {
    const { id } = technicianIdParamSchema.parse(req.params);

    const reviews = await listReviewsForTechnician(id);

    sendResponse(res, {
        message: "Reviews retrieved successfully",
        data: { reviews },
    });
});
