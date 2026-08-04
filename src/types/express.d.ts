import type { UserJwtPayload } from "../utils/jwt";

declare global {
    namespace Express {
        interface Request {
            user?: UserJwtPayload;
        }
    }
}

export {};
