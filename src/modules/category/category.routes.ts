import { Router, type IRouter } from "express";
import { getCategories } from "./category.controller";

const categoryRouter: IRouter = Router();

categoryRouter.get("/", getCategories);

export default categoryRouter;
