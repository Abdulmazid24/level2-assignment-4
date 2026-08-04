import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import {
    adminBookingFilterSchema,
    updateUserStatusSchema,
    userFilterSchema,
    userIdParamSchema,
} from "./admin.validation";
import {
    getPlatformStats,
    listAllBookings,
    listUsers,
    updateUserStatus,
} from "./admin.service";

export const getUsers = catchAsync(async (req: Request, res: Response) => {
    const filters = userFilterSchema.parse(req.query);

    const { users, meta } = await listUsers(filters);

    sendResponse(res, {
        message: "Users retrieved successfully",
        data: { users, meta },
    });
});

export const setUserStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = userIdParamSchema.parse(req.params);
    const { status } = updateUserStatusSchema.parse(req.body);

    const user = await updateUserStatus(req.user!.id, id, status);

    sendResponse(res, {
        message: `User ${status === "BANNED" ? "banned" : "reinstated"} successfully`,
        data: { user },
    });
});

export const getAllBookings = catchAsync(async (req: Request, res: Response) => {
    const filters = adminBookingFilterSchema.parse(req.query);

    const { bookings, meta } = await listAllBookings(filters);

    sendResponse(res, {
        message: "Bookings retrieved successfully",
        data: { bookings, meta },
    });
});

export const getStats = catchAsync(async (_req: Request, res: Response) => {
    const stats = await getPlatformStats();

    sendResponse(res, { message: "Stats retrieved successfully", data: { stats } });
});
