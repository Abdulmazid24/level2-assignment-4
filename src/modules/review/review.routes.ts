import { Router, type IRouter } from "express";
import auth from "../../middleware/auth";
import { addReview, getTechnicianReviews } from "./review.controller";

const reviewRouter: IRouter = Router();

reviewRouter.post("/", auth("CUSTOMER"), addReview);
reviewRouter.get("/technician/:id", getTechnicianReviews);

export default reviewRouter;
