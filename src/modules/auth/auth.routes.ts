import { Router, type IRouter } from "express";
import auth from "../../middleware/auth";
import { login, me, register, updateMe } from "./auth.controller";

const authRouter: IRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", auth(), me);
authRouter.patch("/me", auth(), updateMe);

export default authRouter;
