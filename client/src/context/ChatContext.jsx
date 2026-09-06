import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  contacts as initialContacts,
  conversations as initialConversations,
  olderMessagesByChat,
  unreadCounts as initialUnread,
  pickAutoReply,
  AVATAR_PALETTE,
} from "../data/dummyData";

const ChatContext = createContext(null);

let idCounter = 1000;
const nextId = () => `local-${idCounter++}`;
let groupIdCounter = 1;

function groupInitials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatNow() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatProvider({ children }) {
  const [contacts, setContacts] = useState(initialContacts);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messagesByChat, setMessagesByChat] = useState(initialConversations);
  const [unreadCounts, setUnreadCounts] = useState(initialUnread);
  const [typingChatId, setTypingChatId] = useState(null);
  const [loadedOlder, setLoadedOlder] = useState({});
  const [refreshingChatId, setRefreshingChatId] = useState(null);

  const openChat = useCallback((chatId) => {
    setActiveChatId(chatId);
    setUnreadCounts((prev) => ({ ...prev, [chatId]: 0 }));
  }, []);

  const closeChat = useCallback(() => setActiveChatId(null), []);

  const sendMessage = useCallback((chatId, text, replyTo = null) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const newMessage = { id: nextId(), from: "me", text: trimmed, time: formatNow(), status: "sent", ...(replyTo ? { replyTo: { id: replyTo.id, text: replyTo.text, from: replyTo.from } } : {}) };
    setMessagesByChat((prev) => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), newMessage],
    }));

    // Simulate delivery tick shortly after.
    setTimeout(() => {
      setMessagesByChat((prev) => ({
        ...prev,
        [chatId]: (prev[chatId] || []).map((m) => (m.id === newMessage.id ? { ...m, status: "delivered" } : m)),
      }));
    }, 500);

    // Simulate the other person typing, then replying.
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

        // Replies stay in the conversation, but the quoted preview must no
        // longer expose the deleted message's original content.
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

  // Creates a brand-new group chat out of the picked contacts and opens it.
  // Returns the new group's id.
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
    if (loadedOlder[chatId] || refreshingChatId) return;
    const older = olderMessagesByChat[chatId];
    if (!older || !older.length) return;

    setRefreshingChatId(chatId);
    setTimeout(() => {
      setMessagesByChat((prev) => ({
        ...prev,
        [chatId]: [...older, ...(prev[chatId] || [])],
      }));
      setLoadedOlder((prev) => ({ ...prev, [chatId]: true }));
      setRefreshingChatId(null);
    }, 700);
  }, [loadedOlder, refreshingChatId]);

  // Wipes every message in a chat but keeps the contact/chat itself around.
  const clearChat = useCallback((chatId) => {
    setMessagesByChat((prev) => ({ ...prev, [chatId]: [] }));
  }, []);

  const toggleBlock = useCallback((chatId) => {
    setContacts((prev) => prev.map((c) => (c.id === chatId ? { ...c, blocked: !c.blocked } : c)));
  }, []);

  // Removes a friend (or leaves a group) from the chat list and its local conversation data.
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

  // Removes the chat entirely (contact + history) and backs out of it if
  // it happens to be the one currently open.
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
      hasMoreOlder: (chatId) => Boolean(olderMessagesByChat[chatId]) && !loadedOlder[chatId],
    }),
    [
      contacts,
      activeChatId,
      openChat,
      closeChat,
      messagesByChat,
      sendMessage,
      deleteMessage,
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
      loadedOlder,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within a ChatProvider");
  return ctx;
}
