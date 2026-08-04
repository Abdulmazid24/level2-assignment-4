import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import {
    technicianFilterSchema,
    technicianIdParamSchema,
    updateAvailabilitySchema,
    updateProfileSchema,
} from "./technician.validation";
import {
    getTechnicianById,
    listTechnicians,
    replaceAvailability,
    upsertTechnicianProfile,
} from "./technician.service";

export const getTechnicians = catchAsync(async (req: Request, res: Response) => {
    const filters = technicianFilterSchema.parse(req.query);

    const { technicians, meta } = await listTechnicians(filters);

    sendResponse(res, {
        message: "Technicians retrieved successfully",
        data: { technicians, meta },
    });
});

export const getTechnician = catchAsync(async (req: Request, res: Response) => {
    const { id } = technicianIdParamSchema.parse(req.params);

    const technician = await getTechnicianById(id);

    sendResponse(res, {
        message: "Technician retrieved successfully",
        data: { technician },
    });
});

export const updateProfile = catchAsync(async (req: Request, res: Response) => {
    const input = updateProfileSchema.parse(req.body);

    const profile = await upsertTechnicianProfile(req.user!.id, input);

    sendResponse(res, {
        message: "Profile saved successfully",
        data: { profile },
    });
});

export const updateAvailability = catchAsync(async (req: Request, res: Response) => {
    const input = updateAvailabilitySchema.parse(req.body);

    const availability = await replaceAvailability(req.user!.id, input);

    sendResponse(res, {
        message: "Availability updated successfully",
        data: { availability },
    });
});
