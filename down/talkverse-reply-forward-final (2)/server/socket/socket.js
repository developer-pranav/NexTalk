import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";
import { Connection } from "../models/connection.model.js";


const initializeSocket = (io) => {

    // Socket Authentication
    io.use(async (socket, next) => {

        try {
            const cookies = socket.handshake.headers.cookie;

            if (!cookies) {
                return next(
                    new Error("Authentication required")
                );
            }

            const accessToken = cookies
                .split("; ")
                .find(cookie =>
                    cookie.startsWith("accessToken=")
                )
                ?.split("=")[1];

            if (!accessToken) {
                return next(
                    new Error("Access token is required")
                );
            }

            const decodedToken = jwt.verify(
                accessToken,
                process.env.ACCESS_TOKEN_SECRET
            );

            const user = await User.findById(
                decodedToken._id
            ).select("-password -refreshToken");

            if (!user) {
                return next(
                    new Error("User not found")
                );
            }

            socket.user = user;

            next();

        } catch (error) {

            next(
                new Error("Invalid or expired access token")
            );

        }

    });


    io.on("connection", (socket) => {

        console.log(
            `User connected: ${socket.user.username}`,
            socket.id
        );


        // Join Conversation
        socket.on(
            "joinConversation",
            async (conversationId) => {

                try {

                    const conversation =
                        await Conversation.findById(
                            conversationId
                        );

                    if (!conversation) {
                        return socket.emit(
                            "socketError",
                            "Conversation not found"
                        );
                    }

                    const isMember =
                        conversation.members.some(
                            member =>
                                member.toString() ===
                                socket.user._id.toString()
                        );

                    if (!isMember) {
                        return socket.emit(
                            "socketError",
                            "You are not a member of this conversation"
                        );
                    }

                    socket.join(conversationId);

                    console.log(
                        `${socket.user.username} joined conversation ${conversationId}`
                    );

                } catch (error) {

                    socket.emit(
                        "socketError",
                        "Failed to join conversation"
                    );

                }

            }
        );


        // Leave Conversation
        socket.on(
            "leaveConversation",
            (conversationId) => {

                socket.leave(conversationId);

                console.log(
                    `${socket.user.username} left conversation ${conversationId}`
                );

            }
        );


        // Send Message
        socket.on(
            "sendMessage",
            async ({ conversationId, content, replyTo = null }) => {

                try {

                    if (!content?.trim()) {
                        return socket.emit(
                            "socketError",
                            "Message content is required"
                        );
                    }

                    const conversation =
                        await Conversation.findById(
                            conversationId
                        );

                    if (!conversation) {
                        return socket.emit(
                            "socketError",
                            "Conversation not found"
                        );
                    }

                    const isMember =
                        conversation.members.some(
                            member =>
                                member.toString() ===
                                socket.user._id.toString()
                        );

                    if (!isMember) {
                        return socket.emit(
                            "socketError",
                            "You are not a member of this conversation"
                        );
                    }


                    // Block check for direct conversation
                    if (conversation.type === "direct") {

                        const otherUser =
                            conversation.members.find(
                                member =>
                                    member.toString() !==
                                    socket.user._id.toString()
                            );

                        const blocked =
                            await Connection.findOne({
                                status: "blocked",
                                $or: [
                                    {
                                        sender: socket.user._id,
                                        receiver: otherUser
                                    },
                                    {
                                        sender: otherUser,
                                        receiver: socket.user._id
                                    }
                                ]
                            });

                        if (blocked) {
                            return socket.emit(
                                "socketError",
                                "You cannot send messages to this user"
                            );
                        }

                    }


                    // Validate an optional reply target before saving.
                    let replyMessage = null;
                    if (replyTo) {
                        replyMessage = await Message.findOne({
                            _id: replyTo,
                            conversation: conversationId,
                        });
                        if (!replyMessage) {
                            return socket.emit(
                                "socketError",
                                "The message you are replying to was not found"
                            );
                        }
                    }

                    // Save message
                    const message =
                        await Message.create({
                            conversation: conversationId,
                            sender: socket.user._id,
                            type: "text",
                            content: content.trim(),
                            ...(replyMessage ? { replyTo: replyMessage._id } : {}),
                        });


                    // Update last message
                    conversation.lastMessage =
                        message._id;

                    await conversation.save();


                    // Populate sender
                    const populatedMessage =
                        await Message.findById(
                            message._id
                        ).populate(
                            "sender",
                            "username fullname avatar"
                        ).populate({
                            path: "replyTo",
                            select: "content type media sender deleted isEdited",
                            populate: {
                                path: "sender",
                                select: "username fullname avatar"
                            }
                        });


                    // Send to conversation room
                    io.to(conversationId).emit(
                        "newMessage",
                        populatedMessage
                    );

                } catch (error) {

                    socket.emit(
                        "socketError",
                        "Failed to send message"
                    );

                }

            }
        );


        // Forward an existing message into another conversation.
        // The original media/content is reused; no new Cloudinary upload is needed.
        socket.on(
            "forwardMessage",
            async ({ targetConversationId, messageId }) => {
                try {
                    if (!targetConversationId || !messageId) {
                        return socket.emit("socketError", "Forward data is incomplete");
                    }

                    const targetConversation = await Conversation.findById(targetConversationId);
                    if (!targetConversation) {
                        return socket.emit("socketError", "Target conversation not found");
                    }

                    const isTargetMember = targetConversation.members.some(
                        (member) => member.toString() === socket.user._id.toString()
                    );
                    if (!isTargetMember) {
                        return socket.emit("socketError", "You are not a member of the target conversation");
                    }

                    const original = await Message.findById(messageId);
                    if (!original || original.deleted) {
                        return socket.emit("socketError", "Message cannot be forwarded");
                    }

                    // Sender must also have access to the original conversation.
                    const sourceConversation = await Conversation.findById(original.conversation);
                    const isSourceMember = sourceConversation?.members.some(
                        (member) => member.toString() === socket.user._id.toString()
                    );
                    if (!isSourceMember) {
                        return socket.emit("socketError", "You cannot forward this message");
                    }

                    if (targetConversation.type === "direct") {
                        const otherUser = targetConversation.members.find(
                            (member) => member.toString() !== socket.user._id.toString()
                        );
                        const blocked = await Connection.findOne({
                            status: "blocked",
                            $or: [
                                { sender: socket.user._id, receiver: otherUser },
                                { sender: otherUser, receiver: socket.user._id },
                            ],
                        });
                        if (blocked) {
                            return socket.emit("socketError", "You cannot send messages to this user");
                        }
                    }

                    const forwardedMessage = await Message.create({
                        conversation: targetConversationId,
                        sender: socket.user._id,
                        type: original.type,
                        content: original.content,
                        media: original.media,
                        forwarded: true,
                    });

                    targetConversation.lastMessage = forwardedMessage._id;
                    await targetConversation.save();

                    const populated = await Message.findById(forwardedMessage._id)
                        .populate("sender", "username fullname avatar")
                        .populate("conversation", "type members");

                    io.to(targetConversationId).emit("newMessage", populated);
                } catch (error) {
                    console.error("Failed to forward message:", error);
                    socket.emit("socketError", "Failed to forward message");
                }
            }
        );


        // Broadcast a media message that was already persisted by the REST API.
        // The sender adds the saved message locally; only the other participants
        // need the realtime event, preventing duplicates in the sender's chat.
        socket.on(
            "broadcastMediaMessage",
            async ({ conversationId, messageId }) => {
                try {
                    if (!conversationId || !messageId) {
                        return socket.emit("socketError", "Media broadcast data is incomplete");
                    }

                    const conversation = await Conversation.findById(conversationId);
                    if (!conversation) {
                        return socket.emit("socketError", "Conversation not found");
                    }

                    const isMember = conversation.members.some(
                        (member) => member.toString() === socket.user._id.toString()
                    );

                    if (!isMember) {
                        return socket.emit("socketError", "You are not a member of this conversation");
                    }

                    const message = await Message.findOne({
                        _id: messageId,
                        conversation: conversationId,
                    }).populate("sender", "username fullname avatar");

                    if (!message) {
                        return socket.emit("socketError", "Media message not found");
                    }

                    socket.to(conversationId).emit("newMessage", message);
                } catch (error) {
                    console.error("Failed to broadcast media message:", error);
                    socket.emit("socketError", "Failed to broadcast media message");
                }
            }
        );


        // Typing
        socket.on(
            "typing",
            (conversationId) => {

                socket.to(conversationId).emit(
                    "userTyping",
                    {
                        userId: socket.user._id,
                        username: socket.user.username
                    }
                );

            }
        );


        // Stop Typing
        socket.on(
            "stopTyping",
            (conversationId) => {

                socket.to(conversationId).emit(
                    "userStoppedTyping",
                    {
                        userId: socket.user._id
                    }
                );

            }
        );


        // Disconnect
        socket.on("disconnect", () => {

            console.log(
                `User disconnected: ${socket.user.username}`,
                socket.id
            );

        });

    });

};


export {
    initializeSocket
};