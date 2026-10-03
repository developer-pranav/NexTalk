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
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
    },
});

app.set("io", io);

initializeSocket(io);

connectDB()
    .then(async () => {
        
        const { User } = await import("./models/user.model.js");
        const { getRandomDefaultAvatar } = await import("./config/defaultAvatars.js");

        const usersWithoutAvatar = await User.find({
            $or: [{ avatar: { $exists: false } }, { avatar: null }, { avatar: "" }],
            gender: { $in: ["male", "female"] },
        }).select("_id gender");

        for (const user of usersWithoutAvatar) {
            await User.updateOne(
                { _id: user._id },
                { $set: { avatar: getRandomDefaultAvatar(user.gender) } }
            );
        }

        await User.updateMany({ isOnline: true }, { $set: { isOnline: false } });
        httpServer.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    })
    .catch((error) => {
        console.error("Database connection failed:", error);
    });