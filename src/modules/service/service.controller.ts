import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import {
    createServiceSchema,
    serviceFilterSchema,
    serviceIdParamSchema,
    updateServiceSchema,
} from "./service.validation";
import {
    createService,
    deleteService,
    getServiceById,
    listOwnServices,
    listServices,
    updateService,
} from "./service.service";

export const getServices = catchAsync(async (req: Request, res: Response) => {
    const filters = serviceFilterSchema.parse(req.query);

    const { services, meta } = await listServices(filters);

    sendResponse(res, {
        message: "Services retrieved successfully",
        data: { services, meta },
    });
});

export const getService = catchAsync(async (req: Request, res: Response) => {
    const { id } = serviceIdParamSchema.parse(req.params);

    const service = await getServiceById(id);

    sendResponse(res, {
        message: "Service retrieved successfully",
        data: { service },
    });
});

export const getMyServices = catchAsync(async (req: Request, res: Response) => {
    const services = await listOwnServices(req.user!.id);

    sendResponse(res, {
        message: "Services retrieved successfully",
        data: { services },
    });
});

export const addService = catchAsync(async (req: Request, res: Response) => {
    const input = createServiceSchema.parse(req.body);

    const service = await createService(req.user!.id, input);

    sendResponse(
        res,
        { message: "Service created successfully", data: { service } },
        201,
    );
});

export const editService = catchAsync(async (req: Request, res: Response) => {
    const { id } = serviceIdParamSchema.parse(req.params);
    const input = updateServiceSchema.parse(req.body);

    const service = await updateService(req.user!.id, id, input);

    sendResponse(res, {
        message: "Service updated successfully",
        data: { service },
    });
});

export const removeService = catchAsync(async (req: Request, res: Response) => {
    const { id } = serviceIdParamSchema.parse(req.params);

    await deleteService(req.user!.id, id);

    sendResponse(res, { message: "Service deleted successfully" });
});
