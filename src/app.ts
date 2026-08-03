import express, { type Application } from "express";
import cookieParser from "cookie-parser";
import prisma from "./lib/prisma";
import { notFoundMiddleware } from "./middleware/not-found";
import { globalErrorHandle } from "./middleware/global-error";

const app: Application = express();

// Built-in middlewares
app.use(express.json());
app.use(cookieParser());

// Routes
app.get("/cars", async (req, res) => {
   const cars = await prisma.car.findMany();
   res.json(cars);
});

// Error handling middlewares (must be last)
app.use(notFoundMiddleware);
app.use(globalErrorHandle);

export default app;