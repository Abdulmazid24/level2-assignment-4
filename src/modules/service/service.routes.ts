import { Router, type IRouter } from "express";
import { getService, getServices } from "./service.controller";

const serviceRouter: IRouter = Router();

serviceRouter.get("/", getServices);
serviceRouter.get("/:id", getService);

export default serviceRouter;
