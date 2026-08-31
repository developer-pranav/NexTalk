import { useEffect, useState } from "react";
import { io } from "socket.io-client";

function App() {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const newSocket = io("http://localhost:8000", {
            withCredentials: true
        });

        newSocket.on("connect", () => {
            console.log("Connected:", newSocket.id);
            setConnected(true);
        });

        newSocket.on("disconnect", () => {
            console.log("Disconnected");
            setConnected(false);
        });

        newSocket.on("newMessage", (message) => {
            setMessages((prev) => [
                ...prev,
                message
            ]);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    const sendMessage = () => {
        if (!message.trim()) return;

        socket.emit("sendMessage", message.trim());

        setMessage("");
    };

    return (
        <div
            style={{
                width: "400px",
                margin: "100px auto",
                fontFamily: "Arial"
            }}
        >
            <h2>Socket.IO Test</h2>

            <p>
                Status:{" "}
                <span style={{ color: connected ? "green" : "red" }}>
                    {connected ? "Connected" : "Disconnected"}
                </span>
            </p>

            <div
                style={{
                    display: "flex",
                    gap: "10px"
                }}
            >
                <input
                    type="text"
                    value={message}
                    placeholder="Enter message..."
                    onChange={(e) =>
                        setMessage(e.target.value)
                    }
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            sendMessage();
                        }
                    }}
                />

                <button onClick={sendMessage}>
                    Send
                </button>
            </div>

            <h3>Messages</h3>

            <div>
                {messages.map((msg, index) => (
                    <p key={index}>
                        &gt; {msg}
                    </p>
                ))}
            </div>
        </div>
    );
}

export default App;