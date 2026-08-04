import { Router, type IRouter } from "express";
import auth from "../../middleware/auth";
import { getAllBookings, getStats, getUsers, setUserStatus } from "./admin.controller";
import {
    addCategory,
    editCategory,
    getCategories,
    removeCategory,
} from "../category/category.controller";

const adminRouter: IRouter = Router();

adminRouter.use(auth("ADMIN"));

adminRouter.get("/stats", getStats);

adminRouter.get("/users", getUsers);
adminRouter.patch("/users/:id", setUserStatus);

adminRouter.get("/bookings", getAllBookings);

adminRouter.get("/categories", getCategories);
adminRouter.post("/categories", addCategory);
adminRouter.patch("/categories/:id", editCategory);
adminRouter.delete("/categories/:id", removeCategory);

export default adminRouter;
