import { io } from "socket.io-client";

export const createTalkVerseSocket = () =>
    io(import.meta.env.VITE_SOCKET_URL || "http://localhost:8000", {
        withCredentials: true,
        transports: ["websocket", "polling"],
    });
