import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/app-error";
import { PrismaClientKnownRequestError, PrismaClientValidationError } from "../../prisma/generated/prisma/internal/prismaNamespace";
import config from "../config";

export const globalErrorHandle: ErrorRequestHandler = (err, req, res, next) => {
   let statusCode = 500;
   let message = "Something went wrong!";
   let errorDetails: unknown = null;

   if (err instanceof ZodError) {
      statusCode = 400;
      message = "Validation failed.";
      errorDetails = err.issues;
   } else if (err instanceof AppError) {
      statusCode = err.statusCode;
      message = err.message;
      errorDetails = err.errorDetails ?? null;
   } else if (err instanceof PrismaClientKnownRequestError) {
      switch (err.code) {
         case "P2002":
            statusCode = 409;
            message = "Duplicate entry. This record already exists.";
            errorDetails = { code: err.code, meta: err.meta };
            break;
         case "P2025":
            statusCode = 404;
            message = "Record not found.";
            errorDetails = { code: err.code, meta: err.meta };
            break;
         default:
            statusCode = 500;
            message = "Database error.";
            errorDetails = { code: err.code, meta: err.meta };
      }
   } else if (err instanceof PrismaClientValidationError) {
      statusCode = 400;
      message = "Invalid data provided to the database.";
      errorDetails = err.message;
   }

   if (statusCode === 500 && config.NODE_ENV === "production") {
      message = "Internal server error.";
      errorDetails = null;
   } else if (
      statusCode === 500 &&
      config.NODE_ENV !== "production" &&
      err instanceof Error &&
      errorDetails === null
   ) {
      message = err.message;
      errorDetails = err.stack;
   }

   res.status(statusCode).json({
      success: false,
      message,
      errorDetails,
   });
};