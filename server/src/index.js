import connectDB from "./db/index.db.js";
import dotenv from "dotenv";
import { app } from "./app.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { initializeSocket } from "./socket/socket.js";

dotenv.config({
    path: "./.env",
});

const port = process.env.PORT || 8000;

const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        credentials: true
    }
});

initializeSocket(io);

connectDB()
    .then(() => {
        httpServer.listen(port, () => {
            console.log(
                `Server is running on port ${port}`
            );
        });
    });