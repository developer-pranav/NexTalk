import connectDB from "./db/index.db.js";
import dotenv from "dotenv";
import { app } from "./app.js";

dotenv.config({
    path: "./.env",
})

const port = process.env.PORT || "8000";

connectDB()
.then(() => {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`)
    })
})