import { Router, type IRouter } from "express";
import auth from "../../middleware/auth";
import { login, me, register } from "./auth.controller";

const authRouter: IRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", auth(), me);

export default authRouter;
