import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
    pickAutoReply,
    AVATAR_PALETTE,
} from "../data/dummyData";
import { getMyConversations } from "../api/conversations";
import { getMessages } from "../api/messages";
import {
    blockUser,
    unblockUser,
    getBlockedUsers,
} from "../api/friends";
import { useAuth } from "./AuthContext";
import { io } from "socket.io-client";

const ChatContext = createContext(null);

let idCounter = 1000;
const nextId = () => `local-${idCounter++}`;
let groupIdCounter = 1;

const MESSAGES_PAGE_SIZE = 30;

function groupInitials(name) {
    return (name || "")
        .split(" ")
        .filter(Boolean)
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

function colorFor(seed) {
    const str = String(seed || "");
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function formatNow() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatTime(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function mediaLabel(message) {
    if (!message || message.deleted) return message?.deleted ? "This message was deleted" : "";
    if (message.type === "image") return "Photo";
    if (message.type === "video") return "Video";
    if (message.type === "audio") return "Audio";
    if (message.type === "file") return message.media?.fileName || "File";
    return message.content || "";
}

// Maps a conversation returned by GET /conversations (or /conversations/:id)
// into the "contact" shape the existing UI components already know how to render.
function adaptConversation(conversation, myUserId) {
    const isGroup = conversation.type === "group";

    if (isGroup) {
        const name = conversation.groupName || "Group";
        return {
            id: conversation._id,
            name,
            isGroup: true,
            online: false,
            members: (conversation.members || []).length,
            memberIds: (conversation.members || []).map((m) => m._id || m),
            initials: groupInitials(name),
            color: colorFor(conversation._id),
            blocked: Boolean(conversation.blockedByMe),
            blockedByMe: Boolean(conversation.blockedByMe),
            blockedByOther: Boolean(conversation.blockedByOther),
            muted: false,
            lastMessage: mediaLabel(conversation.lastMessage),
            lastMessageId: conversation.lastMessage?._id || null,
            lastMessageTime: formatTime(conversation.lastMessage?.createdAt),
            lastMessageCreatedAt: conversation.lastMessage?.createdAt || null,
            lastMessageFromMe: String(conversation.lastMessage?.sender?._id || conversation.lastMessage?.sender || "") === String(myUserId),
            unreadCount: Number(conversation.unreadCount || 0),
        };
    }

    const other = (conversation.members || []).find(
        (m) => String(m._id || m) !== String(myUserId)
    ) || {};
    const name = other.fullname || other.username || "Unknown";

    return {
        id: conversation._id,
        name,
        isGroup: false,
        online: Boolean(other.isOnline),
        otherUserId: other._id,
        initials: groupInitials(name),
        color: colorFor(other._id || conversation._id),
        blocked: Boolean(conversation.blockedByMe),
        blockedByMe: Boolean(conversation.blockedByMe),
        blockedByOther: Boolean(conversation.blockedByOther),
        muted: false,
        lastMessage: mediaLabel(conversation.lastMessage),
        lastMessageTime: formatTime(conversation.lastMessage?.createdAt),
        lastMessageFromMe: String(conversation.lastMessage?.sender?._id || conversation.lastMessage?.sender || "") === String(myUserId),
        unreadCount: Number(conversation.unreadCount || 0),
    };
}

// Maps a message returned by GET /messages/:conversationId into the shape
// the existing MessageList / MessageBubble components already render.
function adaptMessage(message, myUserId) {
    const senderId = message.sender?._id || message.sender;
    const isMe = String(senderId) === String(myUserId);

    let text = message.content || "";
    if (message.deleted) {
        text = "This message was deleted";
    } else if (message.type && message.type !== "text" && message.media) {
        const label =
            message.type === "image" ? "Photo" :
                message.type === "video" ? "Video" :
                    message.type === "audio" ? "Audio" :
                        message.media.fileName || "File";
        text = `📎 ${label}`;
    }

    const adapted = {
        id: message._id,
        from: isMe ? "me" : "them",
        text,
        time: formatTime(message.createdAt),
        createdAt: message.createdAt,
        deleted: Boolean(message.deleted),
        edited: Boolean(message.isEdited),
        forwarded: Boolean(message.forwarded),
        type: message.type || "text",
        media: message.media || null,
    };

    if (message.replyTo) {
        const reply = message.replyTo;
        const replySenderId = reply.sender?._id || reply.sender;
        const replyText = reply.deleted
            ? "This message was deleted"
            : (reply.content || mediaLabel(reply) || "Message");

        adapted.replyTo = {
            id: reply._id,
            from: String(replySenderId) === String(myUserId) ? "me" : "them",
            text: replyText,
            type: reply.type || "text",
            media: reply.media || null,
        };
    }

    if (!isMe && message.sender?.fullname) {
        adapted.author = message.sender.fullname;
    }

    const deliveredBy = message.deliveredBy || [];
    const seenBy = message.seenBy || [];
    const deliveredByOthers = deliveredBy.filter(
        (id) => String(id?._id || id) !== String(myUserId)
    );
    const seenByOthers = seenBy.filter(
        (id) => String(id?._id || id) !== String(myUserId)
    );

    adapted.isGroup = message.conversation?.type === "group";
    adapted.deliveredCount = deliveredByOthers.length;
    adapted.seenCount = seenByOthers.length;

    if (isMe) {
        adapted.status = seenByOthers.length > 0
            ? "read"
            : deliveredByOthers.length > 0
                ? "delivered"
                : "sent";
    }

    return adapted;
}

export function ChatProvider({ children }) {
    const { user, isAuthenticated } = useAuth();

    const [contacts, setContacts] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);
    const [messagesByChat, setMessagesByChat] = useState({});
    const [unreadCounts, setUnreadCounts] = useState({});
    const [typingChatId, setTypingChatId] = useState(null);
    const activeChatIdRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const [refreshingChatId, setRefreshingChatId] = useState(null);

    const [currentUserId, setCurrentUserId] = useState(null);
    const currentUserIdRef = useRef(null);

    const [contactsLoading, setContactsLoading] = useState(true);
    const [contactsError, setContactsError] = useState(null);

    const [messagesLoading, setMessagesLoading] = useState({});
    const [messagesError, setMessagesError] = useState({});
    const [messagePagination, setMessagePagination] = useState({});
    const loadedChatsRef = useRef(new Set());
    const socketRef = useRef(null);
    const joinedChatRef = useRef(new Set());
    const onlineUserIdsRef = useRef(new Set());
    // Messages can arrive over Socket.IO while the initial conversation list
    // request is still in flight. Keep the latest socket message so a stale
    // REST response cannot overwrite it with "No messages yet".
    const latestSocketMessageRef = useRef(new Map());

    useEffect(() => {
        currentUserIdRef.current = currentUserId;
    }, [currentUserId]);

    useEffect(() => {
        activeChatIdRef.current = activeChatId;
    }, [activeChatId]);

    // Real-time Socket.IO connection. The server authenticates this socket
    // from the same accessToken cookie used by the REST API.
    useEffect(() => {
        if (!isAuthenticated || !user?._id) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            joinedChatRef.current.clear();
            return;
        }

        const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:8000", {
            withCredentials: true,
            transports: ["websocket", "polling"],
        });

        socketRef.current = socket;

        const handleNewMessage = (rawMessage) => {
            const chatId = String(rawMessage?.conversation?._id || rawMessage?.conversation || "");
            if (!chatId) return;

            const adapted = adaptMessage(rawMessage, user._id);

            // Explicit delivery acknowledgement: the recipient's browser has
            // actually received the message, even when that chat is closed.
            if (adapted.from !== "me" && adapted.id) {
                socket.emit("markMessageDelivered", {
                    messageId: adapted.id,
                    conversationId: chatId,
                });

                if (chatId === activeChatIdRef.current) {
                    socket.emit("markMessagesSeen", chatId);
                }
            }

            setMessagesByChat((prev) => {
                const current = prev[chatId] || [];

                // Replace our optimistic clock message with the real DB message.
                if (rawMessage?.clientMessageId) {
                    const tempIndex = current.findIndex(
                        (message) =>
                            String(message.id) === String(rawMessage.clientMessageId)
                    );

                    if (tempIndex !== -1) {
                        const updated = [...current];
                        updated[tempIndex] = adapted;

                        return {
                            ...prev,
                            [chatId]: updated,
                        };
                    }
                }

                // Existing duplicate protection
                if (
                    current.some(
                        (message) => String(message.id) === String(adapted.id)
                    )
                ) {
                    return prev;
                }

                return {
                    ...prev,
                    [chatId]: [...current, adapted],
                };
            });

            // Only incoming messages create unread state. Your own message
            // is echoed back by the private user room and must not increment it.
            if (adapted.from !== "me" && chatId !== activeChatIdRef.current) {
                setUnreadCounts((prev) => ({ ...prev, [chatId]: (prev[chatId] || 0) + 1 }));
            }

            latestSocketMessageRef.current.set(chatId, {
                text: adapted.text,
                time: adapted.time,
                createdAt: rawMessage?.createdAt || null,
                fromMe: adapted.from === "me",
            });

            setContacts((prev) =>
                prev.map((contact) =>
                    String(contact.id) === chatId
                        ? {
                            ...contact,
                            lastMessage: adapted.text,
                            lastMessageId: adapted.id,
                            lastMessageTime: adapted.time,
                            lastMessageCreatedAt: rawMessage?.createdAt || contact.lastMessageCreatedAt || null,
                            lastMessageFromMe: adapted.from === "me",
                        }
                        : contact
                )
            );
        };

        const handleMessageDeleted = ({ messageId, conversationId, lastMessage }) => {
            if (!messageId || !conversationId) return;

            setMessagesByChat((prev) => ({
                ...prev,
                [conversationId]: (prev[conversationId] || []).map((message) => {
                    if (String(message.id) === String(messageId)) {
                        return {
                            ...message,
                            deleted: true,
                            text: "This message was deleted",
                            replyTo: undefined,
                            forwarded: false,
                        };
                    }

                    if (message.replyTo?.id && String(message.replyTo.id) === String(messageId)) {
                        return {
                            ...message,
                            replyTo: { ...message.replyTo, text: "This message was deleted" },
                        };
                    }

                    return message;
                }),
            }));

            // Keep the chat-list preview in sync when the deleted message was
            // the conversation's persisted lastMessage.
            setContacts((prev) => prev.map((contact) => {
                if (String(contact.id) !== String(conversationId)) return contact;

                if (!lastMessage) {
                    return {
                        ...contact,
                        lastMessage: "",
                        lastMessageTime: "",
                        lastMessageCreatedAt: null,
                        lastMessageFromMe: false,
                    };
                }

                const senderId = lastMessage.sender?._id || lastMessage.sender;
                return {
                    ...contact,
                    lastMessage: lastMessage.content || (lastMessage.deleted ? "This message was deleted" : ""),
                    lastMessageTime: formatTime(lastMessage.createdAt),
                    lastMessageCreatedAt: lastMessage.createdAt || null,
                    lastMessageFromMe: String(senderId || "") === String(user._id),
                };
            }));

            latestSocketMessageRef.current.delete(String(conversationId));
        };

        const handleMessageEdited = ({ messageId, conversationId, content, editedAt, lastMessage }) => {
            if (!messageId || !conversationId) return;

            setMessagesByChat((prev) => ({
                ...prev,
                [conversationId]: (prev[conversationId] || []).map((message) =>
                    String(message.id) === String(messageId)
                        ? {
                            ...message,
                            text: content ?? message.text,
                            edited: true,
                            editedAt: editedAt || Date.now(),
                        }
                        : message
                ),
            }));

            // If the edited message is the persisted conversation preview,
            // update the chat list without opening the conversation.
            if (lastMessage && String(lastMessage._id) === String(messageId)) {
                setContacts((prev) => prev.map((contact) =>
                    String(contact.id) === String(conversationId)
                        ? {
                            ...contact,
                            lastMessageId: String(messageId),
                            lastMessage: lastMessage.content || "",
                            lastMessageTime: formatTime(lastMessage.createdAt),
                            lastMessageCreatedAt: lastMessage.createdAt || contact.lastMessageCreatedAt || null,
                        }
                        : contact
                ));
            }
        };

        const handleMessageDelivered = ({ conversationId, messageId, messageIds, userIds }) => {
            if (!conversationId) return;
            const ids = new Set(
                [messageId, ...(messageIds || [])].filter(Boolean).map(String)
            );

            setMessagesByChat((prev) => {
                const current = prev[conversationId] || [];
                return {
                    ...prev,
                    [conversationId]: current.map((message) =>
                        message.from === "me" && ids.has(String(message.id))
                            ? { ...message, status: message.status === "read" ? "read" : "delivered", deliveredCount: Math.max(message.deliveredCount || 0, userIds?.length || 1) }
                            : message
                    ),
                };
            });
        };

        const handleMessagesSeen = ({ conversationId, userId, messageIds, seenCounts }) => {
            if (!conversationId || String(userId) === String(user._id)) return;

            const ids = new Set((messageIds || []).map(String));

            setMessagesByChat((prev) => {
                const current = prev[conversationId] || [];
                return {
                    ...prev,
                    [conversationId]: current.map((message) => {
                        if (message.from !== "me" || !ids.has(String(message.id))) return message;
                        return {
                            ...message,
                            status: "read",
                            seenCount: seenCounts?.[String(message.id)] || Math.max(message.seenCount || 0, 1),
                        };
                    }),
                };
            });
        };

        const handleUserTyping = (data) => {
            const { conversationId, userId } = data;

            if (!conversationId || String(userId) === String(user._id)) {
                return;
            }
            setTypingChatId(String(conversationId));
        };

        const handleUserStoppedTyping = (data) => {
            const { conversationId, userId } = data;

            if (String(userId) === String(user._id)) return;

            setTypingChatId((current) =>
                !conversationId || String(current) === String(conversationId)
                    ? null
                    : current
            );
        };

        const handlePresenceSnapshot = ({ userIds = [] }) => {
            onlineUserIdsRef.current = new Set(userIds.map(String));
            setContacts((prev) => prev.map((contact) => ({
                ...contact,
                online: !contact.isGroup && onlineUserIdsRef.current.has(String(contact.otherUserId)),
            })));
        };

        const handleUserOnline = ({ userId }) => {
            if (!userId) return;
            onlineUserIdsRef.current.add(String(userId));
            setContacts((prev) => prev.map((contact) =>
                String(contact.otherUserId) === String(userId)
                    ? { ...contact, online: true }
                    : contact
            ));
        };

        const handleUserOffline = ({ userId }) => {
            if (!userId) return;
            onlineUserIdsRef.current.delete(String(userId));
            setContacts((prev) => prev.map((contact) =>
                String(contact.otherUserId) === String(userId)
                    ? { ...contact, online: false }
                    : contact
            ));
        };

        const handleBlockStatusChanged = ({
            blockerId,
            blocked,
        }) => {
            if (!blockerId) return;

            setContacts((prev) =>
                prev.map((contact) => {
                    if (
                        String(contact.otherUserId) !==
                        String(blockerId)
                    ) {
                        return contact;
                    }

                    return {
                        ...contact,
                        blocked: false,
                        blockedByMe: false,
                        blockedByOther: Boolean(blocked),
                    };
                })
            );
        };

        const handleSocketError = (message) => {
            setMessagesError((prev) => ({
                ...prev,
                [activeChatIdRef.current || "socket"]: typeof message === "string" ? message : "Socket error",
            }));
        };

        socket.on("connect", () => {
            for (const chatId of loadedChatsRef.current) {
                socket.emit("joinConversation", chatId);
                joinedChatRef.current.add(chatId);
            }
        });

        socket.on("newMessage", handleNewMessage);
        socket.on("messageDeleted", handleMessageDeleted);
        socket.on("messageEdited", handleMessageEdited);
        socket.on("messageDelivered", handleMessageDelivered);
        socket.on("messagesSeen", handleMessagesSeen);
        socket.on("userTyping", handleUserTyping);
        socket.on("userStoppedTyping", handleUserStoppedTyping);
        socket.on("presenceSnapshot", handlePresenceSnapshot);
        socket.on("userOnline", handleUserOnline);
        socket.on("userOffline", handleUserOffline);
        socket.on("blockStatusChanged", handleBlockStatusChanged);
        socket.on("socketError", handleSocketError);
        socket.on("connect_error", (error) => {
            console.error("TalkVerse Socket.IO connection failed:", error.message);
        });

        return () => {
            socket.off("newMessage", handleNewMessage);
            socket.off("messageDeleted", handleMessageDeleted);
            socket.off("messageEdited", handleMessageEdited);
            socket.off("messageDelivered", handleMessageDelivered);
            socket.off("messagesSeen", handleMessagesSeen);
            socket.off("userTyping", handleUserTyping);
            socket.off("userStoppedTyping", handleUserStoppedTyping);
            socket.off("presenceSnapshot", handlePresenceSnapshot);
            socket.off("userOnline", handleUserOnline);
            socket.off("userOffline", handleUserOffline);
            socket.off("blockStatusChanged", handleBlockStatusChanged);
            socket.off("socketError", handleSocketError);
            socket.disconnect();
            socketRef.current = null;
            joinedChatRef.current.clear();
        };
    }, [isAuthenticated, user?._id]);

    // Load real conversations only after authentication is restored/created.
    useEffect(() => {
        let cancelled = false;

        if (!isAuthenticated || !user?._id) {
            setCurrentUserId(null);
            setContacts([]);
            setMessagesByChat({});
            setUnreadCounts({});
            setActiveChatId(null);
            setContactsLoading(false);
            setContactsError(null);
            loadedChatsRef.current.clear();
            onlineUserIdsRef.current.clear();
            return () => {
                cancelled = true;
            };
        }

        async function loadConversations() {
            setContactsLoading(true);
            setContactsError(null);
            setCurrentUserId(user._id);

            try {
                const [conversationsResponse, blockedResponse] = await Promise.all([
                    getMyConversations(),
                    getBlockedUsers(),
                ]);

                if (cancelled) return;

                const blockedUsers = blockedResponse?.data || [];

                const blockedUserIds = new Set(
                    blockedUsers.map((item) =>
                        String(
                            item?._id ||
                            item?.user?._id ||
                            item?.userId ||
                            item
                        )
                    )
                );

                const adapted = (conversationsResponse?.data || []).map((conversation) => {
                    const contact = adaptConversation(conversation, user._id);

                    if (contact.isGroup) {
                        return contact;
                    }

                    const isBlockedFromBackend =
                        Boolean(conversation.blockedByMe) ||
                        Boolean(conversation.blockedByOther);

                    const isBlockedByMeFromList =
                        blockedUserIds.has(String(contact.otherUserId));

                    return {
                        ...contact,
                        blocked: contact.blockedByMe || isBlockedByMeFromList,
                        blockedByMe: contact.blockedByMe || isBlockedByMeFromList,
                        blockedByOther:
                            isBlockedFromBackend
                                ? contact.blockedByOther
                                : false,
                        online: onlineUserIdsRef.current.has(
                            String(contact.otherUserId)
                        ),
                    };
                });
                const merged = adapted.map((contact) => {
                    const pending = latestSocketMessageRef.current.get(String(contact.id));
                    if (!pending) return contact;

                    const serverTime = contact.lastMessageCreatedAt ? new Date(contact.lastMessageCreatedAt).getTime() : 0;
                    const socketTime = pending.createdAt ? new Date(pending.createdAt).getTime() : Date.now();
                    if (socketTime >= serverTime) {
                        return {
                            ...contact,
                            lastMessage: pending.text,
                            lastMessageTime: pending.time,
                            lastMessageCreatedAt: pending.createdAt || contact.lastMessageCreatedAt || null,
                            lastMessageFromMe: pending.fromMe,
                        };
                    }
                    return contact;
                });

                setContacts(merged);
                setUnreadCounts((prev) => {
                    const next = Object.fromEntries(
                        merged
                            .filter((contact) => Number(contact.unreadCount || 0) > 0)
                            .map((contact) => [contact.id, Number(contact.unreadCount || 0)])
                    );
                    // Preserve a just-arrived socket unread when the REST request
                    // raced the message write and returned an older unread count.
                    for (const contact of merged) {
                        const pending = latestSocketMessageRef.current.get(String(contact.id));
                        if (pending && !pending.fromMe && String(contact.id) !== String(activeChatIdRef.current)) {
                            next[contact.id] = Math.max(next[contact.id] || 0, prev[contact.id] || 0, 1);
                        }
                    }
                    return next;
                });
            } catch (error) {
                if (!cancelled) {
                    setContactsError(
                        error?.response?.data?.message || "Failed to load conversations"
                    );
                }
            } finally {
                if (!cancelled) setContactsLoading(false);
            }
        }

        loadConversations();
        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, user?._id]);

    // Refresh the chat list when a friend request is accepted elsewhere in the app.
    useEffect(() => {
        const refreshConversations = async () => {
            if (!isAuthenticated || !user?._id) return;
            try {
                const response = await getMyConversations();
                const adapted = (response?.data || []).map((conversation) => {
                    const contact = adaptConversation(conversation, user._id);
                    return contact.isGroup
                        ? contact
                        : { ...contact, online: onlineUserIdsRef.current.has(String(contact.otherUserId)) };
                });
                const merged = adapted.map((contact) => {
                    const pending = latestSocketMessageRef.current.get(String(contact.id));
                    if (!pending) return contact;

                    const serverTime = contact.lastMessageCreatedAt ? new Date(contact.lastMessageCreatedAt).getTime() : 0;
                    const socketTime = pending.createdAt ? new Date(pending.createdAt).getTime() : Date.now();
                    if (socketTime >= serverTime) {
                        return {
                            ...contact,
                            lastMessage: pending.text,
                            lastMessageTime: pending.time,
                            lastMessageCreatedAt: pending.createdAt || contact.lastMessageCreatedAt || null,
                            lastMessageFromMe: pending.fromMe,
                        };
                    }
                    return contact;
                });

                setContacts(merged);
                setUnreadCounts((prev) => {
                    const next = Object.fromEntries(
                        merged
                            .filter((contact) => Number(contact.unreadCount || 0) > 0)
                            .map((contact) => [contact.id, Number(contact.unreadCount || 0)])
                    );
                    // Preserve a just-arrived socket unread when the REST request
                    // raced the message write and returned an older unread count.
                    for (const contact of merged) {
                        const pending = latestSocketMessageRef.current.get(String(contact.id));
                        if (pending && !pending.fromMe && String(contact.id) !== String(activeChatIdRef.current)) {
                            next[contact.id] = Math.max(next[contact.id] || 0, prev[contact.id] || 0, 1);
                        }
                    }
                    return next;
                });
            } catch {
                // The regular loading effect handles the initial error state.
            }
        };

        window.addEventListener("talkverse:conversations-updated", refreshConversations);
        return () => window.removeEventListener("talkverse:conversations-updated", refreshConversations);
    }, [isAuthenticated, user?._id]);

    // Task 2: replace dummy messages with the real messages API (paginated fetch).
    const fetchMessages = useCallback((chatId, { page = 1, append = false } = {}) => {
        setMessagesLoading((prev) => ({ ...prev, [chatId]: true }));
        setMessagesError((prev) => ({ ...prev, [chatId]: null }));

        return getMessages(chatId, { page, limit: MESSAGES_PAGE_SIZE })
            .then((response) => {
                const { messages: rawMessages, pagination } = response?.data || {};
                // Server returns newest-first for pagination; UI expects oldest-first.
                const adapted = (rawMessages || [])
                    .map((m) => adaptMessage(m, currentUserIdRef.current))
                    .reverse();

                setMessagesByChat((prev) => ({
                    ...prev,
                    [chatId]: append ? [...adapted, ...(prev[chatId] || [])] : adapted,
                }));

                setMessagePagination((prev) => ({
                    ...prev,
                    [chatId]: {
                        page: pagination?.page || page,
                        hasMore: Boolean(pagination?.hasMore),
                    },
                }));
            })
            .catch((error) => {
                setMessagesError((prev) => ({
                    ...prev,
                    [chatId]: error?.response?.data?.message || "Failed to load messages",
                }));
            })
            .finally(() => {
                setMessagesLoading((prev) => ({ ...prev, [chatId]: false }));
            });
    }, []);

    const openChat = useCallback((chatId) => {
        setActiveChatId(chatId);
        setUnreadCounts((prev) => ({ ...prev, [chatId]: 0 }));

        // Local-only groups (created client-side) aren't backed by a real
        // conversation yet, so there's nothing to fetch for them.
        if (chatId.startsWith("group-")) return;

        if (socketRef.current && socketRef.current.connected && !joinedChatRef.current.has(chatId)) {
            socketRef.current.emit("joinConversation", chatId);
            joinedChatRef.current.add(chatId);
        }

        if (socketRef.current?.connected) {
            socketRef.current.emit("markMessagesSeen", chatId);
        }

        if (!loadedChatsRef.current.has(chatId)) {
            loadedChatsRef.current.add(chatId);
            fetchMessages(chatId, { page: 1, append: false });
        }
    }, [fetchMessages]);

    const closeChat = useCallback(() => setActiveChatId(null), []);

    const startTyping = useCallback((chatId) => {
        const socket = socketRef.current;
        if (!socket?.connected || !chatId) return;
        socket.emit("typing", chatId);

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socketRef.current?.emit("stopTyping", chatId);
        }, 1200);
    }, []);

    const stopTyping = useCallback((chatId) => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }
        socketRef.current?.emit("stopTyping", chatId);
    }, []);

    const markMessagesSeen = useCallback((chatId) => {
        if (!chatId || !socketRef.current?.connected) return;
        socketRef.current.emit("markMessagesSeen", chatId);
        setUnreadCounts((prev) => ({ ...prev, [chatId]: 0 }));
    }, []);

    const sendMessage = useCallback((chatId, text, replyTo = null) => {
        const trimmed = String(text || "").trim();
        if (!trimmed) return false;

        const socket = socketRef.current;

        if (!socket?.connected) {
            setMessagesError((prev) => ({
                ...prev,
                [chatId]: "Real-time connection is not available. Please try again.",
            }));
            return false;
        }

        const clientMessageId = `temp-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`;

        // Show the message immediately. It stays as a clock/sending state
        // until the server echoes the persisted message back through Socket.IO.
        const optimisticMessage = {
            id: clientMessageId,
            clientMessageId,
            from: "me",
            text: trimmed,
            type: "text",
            time: formatNow(),
            createdAt: new Date().toISOString(),
            status: "sending",
            deleted: false,
            edited: false,
            forwarded: false,
            isGroup: false,
            deliveredCount: 0,
            seenCount: 0,
            ...(replyTo?.id
                ? {
                    replyTo: {
                        id: replyTo.id,
                        from: replyTo.from,
                        text: replyTo.text,
                        type: replyTo.type,
                        media: replyTo.media || null,
                    },
                }
                : {}),
        };

        setMessagesByChat((prev) => ({
            ...prev,
            [chatId]: [...(prev[chatId] || []), optimisticMessage],
        }));

        // The server should return the persisted message with the same
        // clientMessageId. handleNewMessage() then replaces this clock
        // message with the real message and its sent/delivered/read status.
        socket.emit("sendMessage", {
            conversationId: chatId,
            content: trimmed,
            clientMessageId,
            ...(replyTo?.id ? { replyTo: replyTo.id } : {}),
        });

        return true;
    }, []);

    const sendMediaMessage = useCallback(async (chatId, file) => {
        if (!file) return false;
        try {
            const formData = new FormData();
            formData.append("media", file);

            const response = await import("../api/messages").then((module) =>
                module.sendMediaMessage(chatId, formData)
            );

            const savedMessage = response?.data;
            if (!savedMessage?._id) throw new Error("Media message was not saved");

            // The REST endpoint is the source of truth for the uploaded file.
            // Add the persisted message locally immediately so the sender never
            // depends on a Socket.IO acknowledgement to see their own voice/media.
            const adapted = adaptMessage(
                { ...savedMessage, conversation: chatId },
                currentUserIdRef.current
            );

            setMessagesByChat((prev) => {
                const current = prev[chatId] || [];
                if (current.some((message) => String(message.id) === String(adapted.id))) {
                    return prev;
                }
                return { ...prev, [chatId]: [...current, adapted] };
            });

            // Broadcast only to the other participants. The server deliberately
            // uses socket.to(room), so the sender does not receive a duplicate.
            if (socketRef.current?.connected) {
                socketRef.current.emit("broadcastMediaMessage", {
                    conversationId: chatId,
                    messageId: savedMessage._id,
                });
            }

            return true;
        } catch (error) {
            setMessagesError((prev) => ({
                ...prev,
                [chatId]: error?.response?.data?.message || error?.message || "Failed to send media",
            }));
            return false;
        }
    }, []);

    const forwardMessage = useCallback((targetChatId, message) => {
        if (!message?.id || !targetChatId) return false;
        const socket = socketRef.current;
        if (!socket?.connected) {
            setMessagesError((prev) => ({
                ...prev,
                [targetChatId]: "Real-time connection is not available. Please try again.",
            }));
            return false;
        }

        socket.emit("forwardMessage", {
            targetConversationId: targetChatId,
            messageId: message.id,
        });
        return true;
    }, []);

    const editMessage = useCallback((chatId, messageId, text) => {
        const trimmed = text.trim();
        if (!trimmed) return false;

        let edited = false;
        setMessagesByChat((prev) => ({
            ...prev,
            [chatId]: (prev[chatId] || []).map((message) => {
                if (String(message.id) !== String(messageId) || message.from !== "me" || message.deleted) return message;
                edited = true;
                return { ...message, text: trimmed, edited: true, editedAt: Date.now() };
            }),
        }));

        if (edited) {
            socketRef.current?.emit("editMessage", {
                conversationId: chatId,
                messageId,
                content: trimmed,
            });
        }

        return edited;
    }, []);

    const deleteMessage = useCallback((chatId, messageId) => {
        setMessagesByChat((prev) => ({
            ...prev,
            [chatId]: (prev[chatId] || []).map((message) => {
                if (message.id === messageId) {
                    return {
                        ...message,
                        deleted: true,
                        text: "This message was deleted",
                        replyTo: undefined,
                        forwarded: false,
                    };
                }

                if (message.replyTo?.id === messageId) {
                    return {
                        ...message,
                        replyTo: { ...message.replyTo, text: "This message was deleted" },
                    };
                }

                return message;
            }),
        }));

        // Persist + broadcast the deletion through Socket.IO so every
        // participant updates immediately, even if their chat is closed.
        socketRef.current?.emit("deleteMessage", {
            conversationId: chatId,
            messageId,
        });
    }, []);

    const createGroup = useCallback((name, memberIds) => {
        const trimmed = name.trim();
        if (!trimmed || memberIds.length === 0) return null;

        const id = `group-${groupIdCounter++}`;
        const newGroup = {
            id,
            name: trimmed,
            online: false,
            isGroup: true,
            members: memberIds.length + 1, // + you
            memberIds,
            initials: groupInitials(trimmed),
            color: AVATAR_PALETTE[Math.floor(Math.random() * AVATAR_PALETTE.length)],
        };

        setContacts((prev) => [newGroup, ...prev]);
        setMessagesByChat((prev) => ({ ...prev, [id]: [] }));
        setUnreadCounts((prev) => ({ ...prev, [id]: 0 }));
        setActiveChatId(id);
        return id;
    }, []);

    const loadOlderMessages = useCallback((chatId) => {
        if (refreshingChatId) return;
        const pageInfo = messagePagination[chatId];
        if (!pageInfo?.hasMore) return;

        setRefreshingChatId(chatId);
        fetchMessages(chatId, { page: (pageInfo.page || 1) + 1, append: true }).finally(() => {
            setRefreshingChatId(null);
        });
    }, [refreshingChatId, messagePagination, fetchMessages]);

    const clearChat = useCallback((chatId) => {
        setMessagesByChat((prev) => ({ ...prev, [chatId]: [] }));
    }, []);

    const toggleBlock = useCallback(async (chatId) => {
        const contact = contacts.find((c) => c.id === chatId);

        if (!contact || contact.isGroup || !contact.otherUserId) {
            return false;
        }

        const wasBlockedByMe = Boolean(contact.blockedByMe);

        try {
            if (wasBlockedByMe) {
                await unblockUser(contact.otherUserId);
            } else {
                await blockUser(contact.otherUserId);
            }

            const blocked = !wasBlockedByMe;

            // Update my UI immediately after the DB operation succeeds.
            setContacts((prev) =>
                prev.map((c) => {
                    if (c.id !== chatId) return c;

                    return {
                        ...c,
                        blocked,
                        blockedByMe: blocked,
                        blockedByOther: false,
                    };
                })
            );

            // Tell the other user's connected client immediately.
            if (socketRef.current?.connected) {
                socketRef.current.emit("blockStatusChanged", {
                    targetUserId: contact.otherUserId,
                });
            }

            return true;
        } catch (error) {
            console.error("Failed to toggle block:", error);
            return false;
        }
    }, [contacts]);


    const unfriend = useCallback((chatId) => {
        setContacts((prev) => prev.filter((c) => c.id !== chatId));
        setMessagesByChat((prev) => {
            const next = { ...prev };
            delete next[chatId];
            return next;
        });
        setUnreadCounts((prev) => {
            const next = { ...prev };
            delete next[chatId];
            return next;
        });
        setActiveChatId((current) => (current === chatId ? null : current));
    }, []);

    const toggleMute = useCallback((chatId) => {
        setContacts((prev) => prev.map((c) => (c.id === chatId ? { ...c, muted: !c.muted } : c)));
    }, []);

    const deleteChat = useCallback((chatId) => {
        setContacts((prev) => prev.filter((c) => c.id !== chatId));
        setMessagesByChat((prev) => {
            const next = { ...prev };
            delete next[chatId];
            return next;
        });
        setUnreadCounts((prev) => {
            const next = { ...prev };
            delete next[chatId];
            return next;
        });
        setActiveChatId((current) => (current === chatId ? null : current));
    }, []);

    const value = useMemo(
        () => ({
            contacts,
            activeChatId,
            openChat,
            closeChat,
            messagesByChat,
            sendMessage,
            sendMediaMessage,
            startTyping,
            stopTyping,
            markMessagesSeen,
            deleteMessage,
            editMessage,
            forwardMessage,
            createGroup,
            clearChat,
            toggleBlock,
            unfriend,
            toggleMute,
            deleteChat,
            unreadCounts,
            typingChatId,
            loadOlderMessages,
            refreshingChatId,
            hasMoreOlder: (chatId) => Boolean(messagePagination[chatId]?.hasMore),
            // Minimal loading/error state for the real conversations + messages APIs.
            currentUserId,
            contactsLoading,
            contactsError,
            messagesLoading,
            messagesError,
        }),
        [
            contacts,
            activeChatId,
            openChat,
            closeChat,
            messagesByChat,
            sendMessage,
            sendMediaMessage,
            startTyping,
            stopTyping,
            markMessagesSeen,
            deleteMessage,
            editMessage,
            forwardMessage,
            createGroup,
            clearChat,
            toggleBlock,
            unfriend,
            toggleMute,
            deleteChat,
            unreadCounts,
            typingChatId,
            loadOlderMessages,
            refreshingChatId,
            messagePagination,
            currentUserId,
            contactsLoading,
            contactsError,
            messagesLoading,
            messagesError,
        ]
    );

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
    const ctx = useContext(ChatContext);
    if (!ctx) throw new Error("useChat must be used within a ChatProvider");
    return ctx;
}