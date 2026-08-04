import express, { type Application } from "express";
import cookieParser from "cookie-parser";
import authRouter from "./modules/auth/auth.routes";
import { notFoundHandler } from "./middleware/not-found";
import { globalErrorHandler } from "./middleware/global-error";

const app: Application = express();

// Built-in middlewares
app.use(express.json());
app.use(cookieParser());

// Health check
app.get("/", (_req, res) => {
    res.send("Server is running ✅");
});

// Routes
app.use("/auth", authRouter);

// Error handling middlewares (must be last)
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;