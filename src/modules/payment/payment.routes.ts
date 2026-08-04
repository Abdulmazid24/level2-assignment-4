import { Router, type IRouter } from "express";
import auth from "../../middleware/auth";
import { createPayment, getMyPayments, getPayment } from "./payment.controller";

const paymentRouter: IRouter = Router();

paymentRouter.post("/create", auth("CUSTOMER"), createPayment);
paymentRouter.get("/", auth("CUSTOMER", "TECHNICIAN", "ADMIN"), getMyPayments);
paymentRouter.get("/:id", auth("CUSTOMER", "TECHNICIAN", "ADMIN"), getPayment);

export default paymentRouter;
