import express, { type Application } from "express";
import cookieParser from "cookie-parser";
import authRouter from "./modules/auth/auth.routes";
import userRouter from "./modules/user/user.routes";
import carRouter from "./modules/car/car.routes";
import bookingRouter from "./modules/booking/booking.routes";
import paymentRouter from "./modules/payment/payment.routes";
import { webhook } from "./modules/payment/payment.controller";
import { notFoundHandler } from "./middleware/not-found";
import { globalErrorHandler } from "./middleware/global-error";

const app: Application = express();

// Stripe webhook must use raw body (before express.json())
app.post("/payments/webhook", express.raw({ type: "application/json" }), webhook);

// Built-in middlewares
app.use(express.json());
app.use(cookieParser());

// Health check
app.get("/", (_req, res) => {
    res.send("Server is running ✅");
});

// Routes
app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/cars", carRouter);
app.use("/bookings", bookingRouter);
app.use("/payments", paymentRouter);

// Error handling middlewares (must be last)
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;