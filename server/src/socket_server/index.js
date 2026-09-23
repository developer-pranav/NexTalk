import dotenv from "dotenv";

dotenv.config({
    path: "./.env",
});

import { createServer } from "http";
import { Server } from "socket.io";
import { initializeSocket } from "./socket/socket.js";

const { default: connectDB } = await import("./db/index.db.js");
const { app } = await import("./app.js");

const port = process.env.PORT || 8000;

const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
    },
});

initializeSocket(io);

connectDB()
    .then(() => {
        httpServer.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    })
    .catch((error) => {
        console.error("Database connection failed:", error);
    });