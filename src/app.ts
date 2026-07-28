import express, { type Application } from "express";

const app: Application = express();

app.get("/", (req, res) => {
    res.send("Assignment 4: TypeScript Configuration with Express.js")
})

export default app;