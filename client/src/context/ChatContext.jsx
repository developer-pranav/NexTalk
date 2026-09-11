import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
    pickAutoReply,
    AVATAR_PALETTE,
} from "../data/dummyData";
import { getMyConversations } from "../api/conversations";
import { getMessages } from "../api/messages";
import { useAuth } from "./AuthContext";

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
            blocked: false,
            muted: false,
        };
    }

    const other = (conversation.members || []).find(
        (m) => (m._id || m) !== myUserId
    ) || {};
    const name = other.fullname || other.username || "Unknown";

    return {
        id: conversation._id,
        name,
        isGroup: false,
        online: Boolean(other.isOnline),
        lastSeen: other.lastOnline ? formatTime(other.lastOnline) : undefined,
        otherUserId: other._id,
        initials: groupInitials(name),
        color: colorFor(other._id || conversation._id),
        blocked: false,
        muted: false,
    };
}

// Maps a message returned by GET /messages/:conversationId into the shape
// the existing MessageList / MessageBubble components already render.
function adaptMessage(message, myUserId) {
    const senderId = message.sender?._id || message.sender;
    const isMe = senderId === myUserId;

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
        deleted: Boolean(message.deleted),
        edited: Boolean(message.isEdited),
    };

    if (!isMe && message.sender?.fullname) {
        adapted.author = message.sender.fullname;
    }

    if (isMe) {
        const seenBy = message.seenBy || [];
        const seenByOthers = seenBy.some((id) => (id?._id || id) !== myUserId);
        adapted.status = seenByOthers ? "read" : "delivered";
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
    const [refreshingChatId, setRefreshingChatId] = useState(null);

    const [currentUserId, setCurrentUserId] = useState(null);
    const currentUserIdRef = useRef(null);

    const [contactsLoading, setContactsLoading] = useState(true);
    const [contactsError, setContactsError] = useState(null);

    const [messagesLoading, setMessagesLoading] = useState({});
    const [messagesError, setMessagesError] = useState({});
    const [messagePagination, setMessagePagination] = useState({});
    const loadedChatsRef = useRef(new Set());

    useEffect(() => {
        currentUserIdRef.current = currentUserId;
    }, [currentUserId]);

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
            return () => {
                cancelled = true;
            };
        }

        async function loadConversations() {
            setContactsLoading(true);
            setContactsError(null);
            setCurrentUserId(user._id);

            try {
                const conversationsResponse = await getMyConversations();
                if (cancelled) return;

                const adapted = (conversationsResponse?.data || []).map((conversation) =>
                    adaptConversation(conversation, user._id)
                );
                setContacts(adapted);
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

        if (!loadedChatsRef.current.has(chatId)) {
            loadedChatsRef.current.add(chatId);
            fetchMessages(chatId, { page: 1, append: false });
        }
    }, [fetchMessages]);

    const closeChat = useCallback(() => setActiveChatId(null), []);

    const sendMessage = useCallback((chatId, text, replyTo = null) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        const newMessage = { id: nextId(), from: "me", text: trimmed, time: formatNow(), status: "sent", ...(replyTo ? { replyTo: { id: replyTo.id, text: replyTo.text, from: replyTo.from } } : {}) };
        setMessagesByChat((prev) => ({
            ...prev,
            [chatId]: [...(prev[chatId] || []), newMessage],
        }));

        setTimeout(() => {
            setMessagesByChat((prev) => ({
                ...prev,
                [chatId]: (prev[chatId] || []).map((m) => (m.id === newMessage.id ? { ...m, status: "delivered" } : m)),
            }));
        }, 500);

        const typingDelay = 600 + Math.random() * 400;
        const replyDelay = typingDelay + 1200 + Math.random() * 900;

        setTimeout(() => setTypingChatId(chatId), typingDelay);
        setTimeout(() => {
            setTypingChatId((current) => (current === chatId ? null : current));
            setMessagesByChat((prev) => ({
                ...prev,
                [chatId]: [
                    ...(prev[chatId] || []),
                    { id: nextId(), from: "them", text: pickAutoReply(), time: formatNow(), status: "read" },
                ],
            }));
        }, replyDelay);
    }, []);

    const forwardMessage = useCallback((targetChatId, message) => {
        if (!message) return;
        const forwarded = {
            id: nextId(),
            from: "me",
            text: message.text,
            time: formatNow(),
            status: "sent",
            forwarded: true,
            ...(message.replyTo ? { replyTo: message.replyTo } : {}),
        };
        setMessagesByChat((prev) => ({
            ...prev,
            [targetChatId]: [...(prev[targetChatId] || []), forwarded],
        }));
    }, []);

    const editMessage = useCallback((chatId, messageId, text) => {
        const trimmed = text.trim();
        if (!trimmed) return false;

        let edited = false;
        setMessagesByChat((prev) => ({
            ...prev,
            [chatId]: (prev[chatId] || []).map((message) => {
                if (message.id !== messageId || message.from !== "me" || message.deleted) return message;
                edited = true;
                return { ...message, text: trimmed, edited: true, editedAt: Date.now() };
            }),
        }));
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

    const toggleBlock = useCallback((chatId) => {
        setContacts((prev) => prev.map((c) => (c.id === chatId ? { ...c, blocked: !c.blocked } : c)));
    }, []);

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
