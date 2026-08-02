import app from "./app"
import "dotenv/config";
import config from "./config";


if(config.NODE_ENV !== "production") {
   app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000")
})
}


export default app;