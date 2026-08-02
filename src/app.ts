import express, { type Application } from "express";
import prisma from "./lib/prisma";


const app: Application = express();


app.get("/cars", async (req, res) => {
   const cars = await prisma.car.findMany();
   res.json(cars);
})

export default app;