import { Router, type IRouter } from "express";
import auth from "../../middleware/auth";
import { updateAvailability, updateProfile } from "./technician.controller";
import {
    addService,
    editService,
    getMyServices,
    removeService,
} from "../service/service.controller";
import {
    getTechnicianBookings,
    updateTechnicianBooking,
} from "../booking/booking.controller";

// Everything a technician manages about themselves. The public browse routes
// live in technician.routes.ts so they stay free of auth.
const technicianAccountRouter: IRouter = Router();

technicianAccountRouter.use(auth("TECHNICIAN"));

technicianAccountRouter.put("/profile", updateProfile);
technicianAccountRouter.put("/availability", updateAvailability);

technicianAccountRouter.get("/services", getMyServices);
technicianAccountRouter.post("/services", addService);
technicianAccountRouter.patch("/services/:id", editService);
technicianAccountRouter.delete("/services/:id", removeService);

technicianAccountRouter.get("/bookings", getTechnicianBookings);
technicianAccountRouter.patch("/bookings/:id", updateTechnicianBooking);

export default technicianAccountRouter;
