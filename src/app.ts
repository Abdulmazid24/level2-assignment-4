import express, { type Application } from "express";
import cookieParser from "cookie-parser";
import authRouter from "./modules/auth/auth.routes";
import categoryRouter from "./modules/category/category.routes";
import serviceRouter from "./modules/service/service.routes";
import technicianRouter from "./modules/technician/technician.routes";
import technicianAccountRouter from "./modules/technician/technician.account.routes";
import bookingRouter from "./modules/booking/booking.routes";
import paymentRouter from "./modules/payment/payment.routes";
import reviewRouter from "./modules/review/review.routes";
import adminRouter from "./modules/admin/admin.routes";
import { confirmPayment } from "./modules/payment/payment.controller";
import { notFoundHandler } from "./middleware/not-found";
import { globalErrorHandler } from "./middleware/global-error";

const app: Application = express();

// Stripe verifies the signature against the exact bytes it sent, so this route
// has to claim the body before express.json() reparses it.
app.post(
    "/api/payments/confirm",
    express.raw({ type: "application/json" }),
    confirmPayment,
);

app.use(express.json());
app.use(cookieParser());

app.get("/", (_req, res) => {
    res.json({
        success: true,
        message: "FixItNow API is running",
        docs: "/api",
    });
});

app.use("/api/auth", authRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/services", serviceRouter);
app.use("/api/technicians", technicianRouter);
app.use("/api/technician", technicianAccountRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/admin", adminRouter);

// Error handling middlewares (must be last)
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
