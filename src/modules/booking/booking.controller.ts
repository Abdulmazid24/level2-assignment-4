import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import {
    bookingFilterSchema,
    bookingIdParamSchema,
    createBookingSchema,
    technicianBookingActionSchema,
} from "./booking.validation";
import {
    cancelBooking,
    createBooking,
    getBookingForUser,
    listCustomerBookings,
    listTechnicianBookings,
    updateBookingStatusAsTechnician,
} from "./booking.service";

export const addBooking = catchAsync(async (req: Request, res: Response) => {
    const input = createBookingSchema.parse(req.body);

    const booking = await createBooking(req.user!.id, input);

    sendResponse(
        res,
        { message: "Booking created successfully", data: { booking } },
        201,
    );
});

export const getMyBookings = catchAsync(async (req: Request, res: Response) => {
    const filters = bookingFilterSchema.parse(req.query);

    const { bookings, meta } = await listCustomerBookings(req.user!.id, filters);

    sendResponse(res, {
        message: "Bookings retrieved successfully",
        data: { bookings, meta },
    });
});

export const getBooking = catchAsync(async (req: Request, res: Response) => {
    const { id } = bookingIdParamSchema.parse(req.params);

    const booking = await getBookingForUser(req.user!.id, req.user!.role, id);

    sendResponse(res, {
        message: "Booking retrieved successfully",
        data: { booking },
    });
});

export const cancelMyBooking = catchAsync(async (req: Request, res: Response) => {
    const { id } = bookingIdParamSchema.parse(req.params);

    const booking = await cancelBooking(req.user!.id, id);

    sendResponse(res, {
        message: "Booking cancelled successfully",
        data: { booking },
    });
});

export const getTechnicianBookings = catchAsync(async (req: Request, res: Response) => {
    const filters = bookingFilterSchema.parse(req.query);

    const { bookings, meta } = await listTechnicianBookings(req.user!.id, filters);

    sendResponse(res, {
        message: "Bookings retrieved successfully",
        data: { bookings, meta },
    });
});

export const updateTechnicianBooking = catchAsync(async (req: Request, res: Response) => {
    const { id } = bookingIdParamSchema.parse(req.params);
    const input = technicianBookingActionSchema.parse(req.body);

    const booking = await updateBookingStatusAsTechnician(req.user!.id, id, input);

    sendResponse(res, {
        message: `Booking ${input.status.toLowerCase()} successfully`,
        data: { booking },
    });
});
