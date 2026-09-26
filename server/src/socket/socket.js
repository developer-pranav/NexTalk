import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";
import { Connection } from "../models/connection.model.js";


const onlineSockets = new Map();

function addOnlineSocket(userId, socketId) {
    const id = String(userId);

    if (!onlineSockets.has(id)) {
        onlineSockets.set(id, new Set());
    }

    onlineSockets.get(id).add(socketId);

    return onlineSockets.get(id).size === 1;
}

function removeOnlineSocket(userId, socketId) {
    const id = String(userId);
    const sockets = onlineSockets.get(id);

    if (!sockets) return false;

    sockets.delete(socketId);

    if (sockets.size === 0) {
        onlineSockets.delete(id);
        return true;
    }

    return false;
}


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


    io.on("connection", async (socket) => {
        const userId = String(socket.user._id);

        socket.join(`user:${userId}`);

        // Register this socket as online
        const becameOnline = addOnlineSocket(userId, socket.id);

        // Keep database presence in sync
        await User.findByIdAndUpdate(
            socket.user._id,
            {
                isOnline: true,
                lastOnline: null,
            }
        );

        // Send current online users to this client
        socket.emit("presenceSnapshot", {
            userIds: Array.from(onlineSockets.keys()),
        });

        // Tell everyone else that this user came online
        if (becameOnline) {
            socket.broadcast.emit("userOnline", {
                userId: socket.user._id,
            });
        }

        // Mark pending messages as delivered when the user comes online.
        // This does NOT mark them as seen.
        try {
            const conversations = await Conversation.find({
                members: socket.user._id,
            }).select("_id");

            const conversationIds = conversations.map(
                (conversation) => conversation._id
            );

            const pendingMessages = await Message.find({
                conversation: { $in: conversationIds },
                sender: { $ne: socket.user._id },
                deliveredBy: { $ne: socket.user._id },
            }).select("_id conversation sender deliveredBy");

            for (const message of pendingMessages) {
                message.deliveredBy.push(socket.user._id);
                await message.save();

                const senderId = String(message.sender);

                const senderSockets = onlineSockets.get(senderId);

                if (senderSockets) {
                    for (const senderSocketId of senderSockets) {
                        io.to(senderSocketId).emit("messageDelivered", {
                            conversationId: String(message.conversation),
                            messageId: String(message._id),
                            userIds: [String(socket.user._id)],
                        });
                    }
                }
            }
        } catch (error) {
            console.error(
                "Failed to mark pending messages delivered:",
                error
            );
        }

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
            async (
                { conversationId, content, replyTo = null, clientMessageId },
                ack
            ) => {

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
                    const socketMessage = populatedMessage.toObject();

                    if (clientMessageId) {
                        socketMessage.clientMessageId = clientMessageId;
                    }

                    io.to(conversationId).emit(
                        "newMessage",
                        socketMessage
                    );

                    ack?.({
                        ok: true,
                        messageId: populatedMessage._id,
                    });

                } catch (error) {

                    ack?.({
                        ok: false,
                        error: "Message content is required",
                    });

                    return socket.emit(
                        "socketError",
                        "Message content is required"
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
                        conversationId,
                        userId: socket.user._id,
                        username: socket.user.username,
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
                        conversationId,
                        userId: socket.user._id,
                    }
                );
            }
        );

        // Mark Message Delivered
        socket.on("markMessageDelivered", async ({ messageId, conversationId }) => {
            try {
                if (!messageId || !conversationId) return;

                const message = await Message.findOne({
                    _id: messageId,
                    conversation: conversationId,
                });

                if (!message) return;

                const conversation = await Conversation.findById(conversationId);
                if (!conversation) return;

                const isMember = conversation.members.some(
                    (member) => String(member) === String(socket.user._id)
                );

                if (!isMember) return;

                const alreadyDelivered = (message.deliveredBy || []).some(
                    (id) => String(id?._id || id) === String(socket.user._id)
                );

                if (!alreadyDelivered) {
                    message.deliveredBy.push(socket.user._id);
                    await message.save();
                }

                socket.to(conversationId).emit("messageDelivered", {
                    conversationId,
                    messageId,
                    userIds: message.deliveredBy.map((id) => String(id?._id || id)),
                });
            } catch (error) {
                console.error("Failed to mark message delivered:", error);
            }
        });


        // Mark Messages Seen
        socket.on("markMessagesSeen", async (conversationId) => {
            try {
                if (!conversationId) return;

                const conversation = await Conversation.findById(conversationId);
                if (!conversation) return;

                const isMember = conversation.members.some(
                    (member) => String(member) === String(socket.user._id)
                );

                if (!isMember) return;

                const messages = await Message.find({
                    conversation: conversationId,
                    sender: { $ne: socket.user._id },
                });

                const messageIds = [];

                for (const message of messages) {
                    const alreadySeen = (message.seenBy || []).some(
                        (id) => String(id?._id || id) === String(socket.user._id)
                    );

                    if (!alreadySeen) {
                        message.seenBy.push(socket.user._id);
                        await message.save();
                        messageIds.push(String(message._id));
                    }
                }

                if (messageIds.length > 0) {
                    socket.to(conversationId).emit("messagesSeen", {
                        conversationId,
                        userId: socket.user._id,
                        messageIds,
                    });
                }
            } catch (error) {
                console.error("Failed to mark messages seen:", error);
            }
        });
    });


    // Disconnect
    socket.on("disconnect", async () => {
        const userId = String(socket.user._id);

        // Only mark offline when the user has no other active sockets.
        // This prevents one tab closing from marking the user offline
        // while another tab/device is still connected.
        const becameOffline = removeOnlineSocket(
            userId,
            socket.id
        );

        if (!becameOffline) {
            return;
        }

        await User.findByIdAndUpdate(
            socket.user._id,
            {
                isOnline: false,
                lastOnline: new Date(),
            }
        );

        socket.broadcast.emit("userOffline", {
            userId: socket.user._id,
        });

    });

});

};


export {
    initializeSocket
};