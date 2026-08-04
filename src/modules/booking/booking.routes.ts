import { Router, type IRouter } from "express";
import auth from "../../middleware/auth";
import {
    addBooking,
    cancelMyBooking,
    getBooking,
    getMyBookings,
} from "./booking.controller";

const bookingRouter: IRouter = Router();

bookingRouter.post("/", auth("CUSTOMER"), addBooking);
bookingRouter.get("/", auth("CUSTOMER"), getMyBookings);
bookingRouter.get("/:id", auth("CUSTOMER", "TECHNICIAN", "ADMIN"), getBooking);
bookingRouter.patch("/:id/cancel", auth("CUSTOMER"), cancelMyBooking);

export default bookingRouter;
