
export class AppError extends Error {
    statusCode: number;
    errorDetails?: unknown;

    constructor(message: string, statusCode: number, errorDetails?: unknown){
        super(message);
        this.statusCode = statusCode;
        this.errorDetails = errorDetails;
        Error.captureStackTrace(this, this.constructor);
    }
}