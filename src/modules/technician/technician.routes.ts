import { Router, type IRouter } from "express";
import { getTechnician, getTechnicians } from "./technician.controller";

const technicianRouter: IRouter = Router();

technicianRouter.get("/", getTechnicians);
technicianRouter.get("/:id", getTechnician);

export default technicianRouter;
