import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";
import { Connection } from "../models/connection.model.js";

// In-memory presence.
// A user is online while at least one Socket.IO connection is active.
const onlineUserConnections = new Map();

const isUserOnline = (userId) =>
    onlineUserConnections.has(String(userId));

const getOnlineConversationMembers = (conversation, excludeUserId = null) =>
    conversation.members
        .map((member) => member.toString())
        .filter((id) => !excludeUserId || id !== String(excludeUserId))
        .filter(isUserOnline);

const initializeSocket = (io) => {

    // ==========================================
    // SOCKET AUTHENTICATION
    // ==========================================

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


    // ==========================================
    // SOCKET CONNECTION
    // ==========================================

    io.on("connection", async (socket) => {

        console.log(
            `User connected: ${socket.user.username}`,
            socket.id
        );

        const connectedUserId =
            socket.user._id.toString();

        // Every socket gets a private user room. This lets notifications,
        // delivery receipts and seen receipts reach a user even when they
        // have not opened the conversation room.
        socket.join(`user:${connectedUserId}`);

        const previousConnections =
            onlineUserConnections.get(connectedUserId) || 0;

        onlineUserConnections.set(
            connectedUserId,
            previousConnections + 1
        );


        // ==========================================
        // PERSIST ONLINE STATUS
        // ==========================================

        // Only update DB when user's first socket connects.
        if (previousConnections === 0) {

            await User.findByIdAndUpdate(
                connectedUserId,
                {
                    isOnline: true,
                }
            );

        }


        // ==========================================
        // PRESENCE SNAPSHOT
        // ==========================================

        // Send currently online users to this socket.
        socket.emit("presenceSnapshot", {
            userIds: Array.from(
                onlineUserConnections.keys()
            ),
        });


        // ==========================================
        // ONLINE EVENT
        // ==========================================

        // Only broadcast when the user actually
        // transitions from offline -> online.
        if (previousConnections === 0) {

            socket.broadcast.emit(
                "userOnline",
                {
                    userId: connectedUserId,
                }
            );

        }


        // ==========================================
        // JOIN CONVERSATION
        // ==========================================

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

                    // The moment a recipient joins the room, messages that
                    // were waiting for them are considered delivered.
                    const pendingDelivery = await Message.find({
                        conversation: conversationId,
                        sender: { $ne: socket.user._id },
                        deliveredBy: { $ne: socket.user._id },
                    }).select("_id sender");

                    if (pendingDelivery.length) {
                        await Message.updateMany(
                            { _id: { $in: pendingDelivery.map((message) => message._id) } },
                            { $addToSet: { deliveredBy: socket.user._id } }
                        );

                        const senderIds = [...new Set(
                            pendingDelivery.map((message) => String(message.sender))
                        )];

                        for (const senderId of senderIds) {
                            io.to(`user:${senderId}`).emit("messageDelivered", {
                                messageIds: pendingDelivery.map((message) => String(message._id)),
                                conversationId: String(conversationId),
                                userId: connectedUserId,
                            });
                        }
                    }

                    console.log(
                        `${socket.user.username} joined conversation ${conversationId}`
                    );

                } catch (error) {

                    console.error(
                        "Join conversation error:",
                        error
                    );

                    socket.emit(
                        "socketError",
                        "Failed to join conversation"
                    );

                }

            }
        );


        // ==========================================
        // LEAVE CONVERSATION
        // ==========================================

        socket.on(
            "leaveConversation",
            (conversationId) => {

                socket.leave(conversationId);

                console.log(
                    `${socket.user.username} left conversation ${conversationId}`
                );

            }
        );


        // ==========================================
        // SEND MESSAGE
        // ==========================================

        socket.on(
            "sendMessage",
            async ({ conversationId, content }) => {

                try {

                    if (!content?.trim()) {

                        return socket.emit(
                            "socketError",
                            "Message content is required"
                        );

                    }


                    // ==========================================
                    // FIND CONVERSATION
                    // ==========================================

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


                    // ==========================================
                    // MEMBER CHECK
                    // ==========================================

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


                    // ==========================================
                    // BLOCK CHECK
                    // ==========================================

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
                                        receiver: otherUser,
                                    },

                                    {
                                        sender: otherUser,
                                        receiver: socket.user._id,
                                    },

                                ],
                            });


                        if (blocked) {

                            return socket.emit(
                                "socketError",
                                "You cannot send messages to this user"
                            );

                        }

                    }


                    // ==========================================
                    // CREATE MESSAGE
                    // ==========================================

                    const message =
                        await Message.create({
                            conversation: conversationId,
                            sender: socket.user._id,
                            type: "text",
                            content: content.trim(),
                        });


                    // ==========================================
                    // UPDATE LAST MESSAGE
                    // ==========================================

                    // Persist the latest message reference on the conversation
                    // before any realtime event is emitted. The chat list can
                    // therefore show the last message even before the chat opens.
                    await Conversation.findByIdAndUpdate(
                        conversationId,
                        {
                            $set: {
                                lastMessage: message._id,
                                updatedAt: new Date(),
                            },
                        }
                    );
                    conversation.lastMessage = message._id;


                    // ==========================================
                    // DELIVERY STATE
                    // ==========================================
                    // Update delivery BEFORE emitting newMessage. This makes
                    // the first message payload already contain deliveredBy,
                    // so the sender can render ✓✓ immediately without racing
                    // React state against a separate delivery event.
                    const onlineRecipients = getOnlineConversationMembers(
                        conversation,
                        socket.user._id
                    );

                    if (onlineRecipients.length) {
                        await Message.updateOne(
                            { _id: message._id },
                            { $addToSet: { deliveredBy: { $each: onlineRecipients } } }
                        );
                    }


                    // ==========================================
                    // POPULATE SENDER
                    // ==========================================

                    const populatedMessage =
                        await Message.findById(
                            message._id
                        ).populate(
                            "sender",
                            "username fullname avatar"
                        )
                        .populate(
                            "conversation",
                            "type members"
                        );


                    // ==========================================
                    // SEND MESSAGE TO EACH MEMBER'S PRIVATE ROOM
                    // ==========================================
                    // This is important for unread notifications: a user does
                    // not need to have the conversation open to receive a new
                    // message event. Sending once per private user room also
                    // avoids duplicate events when a user is already in the
                    // conversation room.
                    for (const memberId of conversation.members) {
                        io.to(`user:${memberId.toString()}`).emit(
                            "newMessage",
                            populatedMessage
                        );
                    }

                    // Delivery receipt is still emitted for any other sender
                    // state/update path. The newMessage payload already carries
                    // deliveredBy when the recipient is online.
                    if (onlineRecipients.length) {
                        io.to(`user:${socket.user._id.toString()}`).emit("messageDelivered", {
                            messageId: String(message._id),
                            conversationId: String(conversationId),
                            userIds: onlineRecipients,
                        });
                    }

                } catch (error) {

                    console.error(
                        "Send message error:",
                        error
                    );

                    socket.emit(
                        "socketError",
                        "Failed to send message"
                    );

                }

            }
        );


        // ==========================================
        // DELETE MESSAGE
        // ==========================================

        socket.on(
            "deleteMessage",
            async ({ messageId, conversationId }) => {
                try {
                    if (!messageId || !conversationId) return;

                    const message = await Message.findOne({
                        _id: messageId,
                        conversation: conversationId,
                    });

                    if (!message) return;

                    // Only the original sender can delete a message.
                    if (String(message.sender) !== connectedUserId) {
                        socket.emit("socketError", "You can only delete your own messages");
                        return;
                    }

                    const conversation = await Conversation.findById(conversationId);
                    if (!conversation || !conversation.members.some(
                        (member) => String(member) === connectedUserId
                    )) {
                        return;
                    }

                    // Soft-delete so every participant sees the same deleted
                    // message and future message fetches do not resurrect it.
                    await Message.updateOne(
                        { _id: messageId },
                        {
                            $set: {
                                deleted: true,
                                content: "",
                                isEdited: false,
                            },
                            $unset: {
                                attachments: "",
                                replyTo: "",
                            },
                        }
                    );

                    // If this was the conversation preview, move it to the
                    // latest non-deleted message instead of showing a stale one.
                    let lastMessage = null;
                    if (String(conversation.lastMessage) === String(messageId)) {
                        lastMessage = await Message.findOne({
                            conversation: conversationId,
                            deleted: { $ne: true },
                        })
                            .sort({ createdAt: -1 })
                            .select("_id content type createdAt sender deleted");

                        conversation.lastMessage = lastMessage?._id || null;
                        await conversation.save();
                    }

                    // Notify every connected participant, including the sender
                    // and anyone who has not opened the conversation.
                    for (const memberId of conversation.members) {
                        io.to(`user:${memberId.toString()}`).emit("messageDeleted", {
                            messageId: String(messageId),
                            conversationId: String(conversationId),
                            lastMessage: lastMessage
                                ? {
                                    _id: String(lastMessage._id),
                                    content: lastMessage.content || "",
                                    type: lastMessage.type,
                                    createdAt: lastMessage.createdAt,
                                    sender: lastMessage.sender,
                                }
                                : null,
                        });
                    }
                } catch (error) {
                    console.error("Delete message error:", error);
                    socket.emit("socketError", "Failed to delete message");
                }
            }
        );


        // ==========================================
        // EDIT MESSAGE
        // ==========================================

        socket.on(
            "editMessage",
            async ({ messageId, conversationId, content }) => {
                try {
                    const trimmed = String(content || "").trim();
                    if (!messageId || !conversationId || !trimmed) return;

                    const message = await Message.findOne({
                        _id: messageId,
                        conversation: conversationId,
                    });

                    if (!message) return;

                    // Only the original sender can edit their own message.
                    if (String(message.sender) !== connectedUserId) {
                        socket.emit("socketError", "You can only edit your own messages");
                        return;
                    }

                    if (message.deleted) {
                        socket.emit("socketError", "Deleted messages cannot be edited");
                        return;
                    }

                    const conversation = await Conversation.findById(conversationId);
                    if (!conversation || !conversation.members.some(
                        (member) => String(member) === connectedUserId
                    )) {
                        return;
                    }

                    const editedAt = new Date();
                    message.content = trimmed;
                    message.isEdited = true;
                    message.editedAt = editedAt;
                    await message.save();

                    // Keep the persisted chat-list preview in sync when the
                    // edited message is the conversation's current lastMessage.
                    const isLastMessage = String(conversation.lastMessage || "") === String(messageId);

                    const lastMessage = isLastMessage
                        ? {
                            _id: String(message._id),
                            content: message.content,
                            type: message.type,
                            createdAt: message.createdAt,
                            sender: String(message.sender),
                        }
                        : null;

                    // Broadcast to every participant, including users whose
                    // chat is currently closed.
                    for (const memberId of conversation.members) {
                        io.to(`user:${memberId.toString()}`).emit("messageEdited", {
                            messageId: String(message._id),
                            conversationId: String(conversationId),
                            content: message.content,
                            editedAt: editedAt.toISOString(),
                            lastMessage,
                        });
                    }
                } catch (error) {
                    console.error("Edit message error:", error);
                    socket.emit("socketError", "Failed to edit message");
                }
            }
        );


        // ==========================================
        // BROADCAST MEDIA MESSAGE
        // ==========================================

        // Media is uploaded through the authenticated REST endpoint because
        // Socket.IO is not used to stream files. Once MongoDB has the message,
        // the client asks Socket.IO to broadcast that saved message.
        socket.on(
            "broadcastMediaMessage",
            async ({ conversationId, messageId }) => {
                try {
                    if (!conversationId || !messageId) return;

                    const conversation = await Conversation.findById(conversationId);
                    if (!conversation || !conversation.members.some((member) => String(member) === connectedUserId)) {
                        return;
                    }

                    const message = await Message.findOne({
                        _id: messageId,
                        conversation: conversationId,
                        sender: socket.user._id,
                    })
                        .populate("sender", "username fullname avatar")
                        .populate("conversation", "type members");

                    if (!message) return;

                    const onlineRecipients = getOnlineConversationMembers(conversation, socket.user._id);
                    if (onlineRecipients.length) {
                        await Message.updateOne(
                            { _id: message._id },
                            { $addToSet: { deliveredBy: { $each: onlineRecipients } } }
                        );
                        message.deliveredBy = [...new Set([
                            ...(message.deliveredBy || []).map(String),
                            ...onlineRecipients,
                        ])];
                    }

                    for (const memberId of conversation.members) {
                        io.to(`user:${memberId.toString()}`).emit("newMessage", message);
                    }
                } catch (error) {
                    console.error("Broadcast media message error:", error);
                    socket.emit("socketError", "Failed to deliver media message");
                }
            }
        );


        // ==========================================
        // TYPING
        // ==========================================

        socket.on(
            "typing",
            (conversationId) => {

                socket
                    .to(conversationId)
                    .emit(
                        "userTyping",
                        {
                            conversationId,
                            userId: socket.user._id,
                            username: socket.user.username,
                        }
                    );

            }
        );


        // ==========================================
        // STOP TYPING
        // ==========================================

        socket.on(
            "stopTyping",
            (conversationId) => {

                socket
                    .to(conversationId)
                    .emit(
                        "userStoppedTyping",
                        {
                            conversationId,
                            userId: socket.user._id,
                        }
                    );

            }
        );


        // ==========================================
        // MESSAGE DELIVERED
        // ==========================================

        // A message is considered delivered when the recipient has
        // an active Socket.IO connection. The sender gets this update
        // separately so the UI can move from ✓ to ✓✓.
        socket.on(
            "markMessageDelivered",
            async ({ messageId, conversationId }) => {
                try {
                    if (!messageId || !conversationId) return;

                    const message = await Message.findOne({
                        _id: messageId,
                        conversation: conversationId,
                    });

                    if (!message) return;

                    const isMember = message.sender.toString() === connectedUserId
                        ? false
                        : await Conversation.exists({
                            _id: conversationId,
                            members: socket.user._id,
                        });

                    if (!isMember) return;

                    await Message.updateOne(
                        { _id: messageId },
                        { $addToSet: { deliveredBy: socket.user._id } }
                    );

                    // Delivery receipts must reach the sender even when the
                    // sender is not currently inside the conversation room.
                    io.to(`user:${message.sender.toString()}`).emit("messageDelivered", {
                        messageId: String(messageId),
                        conversationId: String(conversationId),
                        userIds: [connectedUserId],
                        userId: connectedUserId,
                    });
                } catch (error) {
                    console.error("Mark message delivered error:", error);
                }
            }
        );


        // ==========================================
        // MARK MESSAGES SEEN
        // ==========================================

        socket.on(
            "markMessagesSeen",
            async (conversationId) => {
                try {
                    const conversation = await Conversation.findById(conversationId);

                    if (!conversation) return;

                    const isMember = conversation.members.some(
                        (member) => member.toString() === connectedUserId
                    );

                    if (!isMember) return;

                    const messages = await Message.find({
                        conversation: conversationId,
                        sender: { $ne: socket.user._id },
                        seenBy: { $ne: socket.user._id },
                    }).select("_id sender");

                    if (!messages.length) return;

                    await Message.updateMany(
                        {
                            _id: { $in: messages.map((message) => message._id) },
                        },
                        {
                            $addToSet: {
                                seenBy: socket.user._id,
                                deliveredBy: socket.user._id,
                            },
                        }
                    );

                    const seenMessages = await Message.find({
                        _id: { $in: messages.map((message) => message._id) },
                    }).select("_id seenBy");

                    const seenCounts = Object.fromEntries(
                        seenMessages.map((message) => [
                            String(message._id),
                            message.seenBy?.length || 0,
                        ])
                    );

                    // Notify senders through their private rooms so the
                    // sender gets Seen even if their chat is not currently open.
                    const senderIds = [...new Set(
                        messages.map((message) => String(message.sender))
                    )];

                    for (const senderId of senderIds) {
                        io.to(`user:${senderId}`).emit("messagesSeen", {
                            conversationId: String(conversationId),
                            userId: connectedUserId,
                            messageIds: messages.map((message) => String(message._id)),
                            seenCounts,
                        });
                    }
                } catch (error) {
                    console.error("Mark messages seen error:", error);
                }
            }
        );


        // ==========================================
        // DISCONNECT
        // ==========================================

        socket.on(
            "disconnect",
            () => {

                console.log(
                    `User disconnected: ${socket.user.username}`,
                    socket.id
                );


                const currentConnections =
                    onlineUserConnections.get(
                        connectedUserId
                    ) || 1;


                // ==========================================
                // LAST CONNECTION CLOSED
                // ==========================================

                if (currentConnections <= 1) {

                    onlineUserConnections.delete(
                        connectedUserId
                    );


                    // Persist offline status
                    User.findByIdAndUpdate(
                        connectedUserId,
                        {
                            isOnline: false,
                            lastOnline: new Date(),
                        }
                    ).catch(
                        (error) => {

                            console.error(
                                "Failed to persist offline presence:",
                                error.message
                            );

                        }
                    );


                    // Broadcast offline event
                    io.emit(
                        "userOffline",
                        {
                            userId: connectedUserId,
                        }
                    );

                } else {

                    // User still has another tab/device connected.
                    onlineUserConnections.set(
                        connectedUserId,
                        currentConnections - 1
                    );

                }

            }
        );

    });

};


export {
    initializeSocket
};