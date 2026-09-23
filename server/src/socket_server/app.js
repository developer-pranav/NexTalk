import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);


app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());


// Routes
import userRoutes from "./routes/user.routes.js";
import connectionRoutes from "./routes/connection.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";
import messageRoutes from "./routes/message.routes.js";

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/connections", connectionRoutes);
app.use("/api/v1/conversations", conversationRoutes);
app.use("/api/v1/messages", messageRoutes);

export { app };