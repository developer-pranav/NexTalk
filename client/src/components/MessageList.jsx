import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check, RefreshCw, X, Trash2 } from "lucide-react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import MessageContextMenu from "./MessageContextMenu";
import { useChat } from "../context/ChatContext";
import ForwardModal from "./ForwardModal";
import ConfirmModal from "./ConfirmModal";
import { useRubberband } from "../hooks/useRubberband";

const REFRESH_TRIGGER_PX = 40;

export default function MessageList({ chatId, messages, isGroup, onNotify, onReply, searchQuery = "", searchIndex = 0, onSearchMatches, searchOpen = false }) {
    const { loadOlderMessages, hasMoreOlder, refreshingChatId, typingChatId, deleteMessage, contacts, forwardMessage } = useChat();
    const scrollRef = useRef(null);
    const contentRef = useRef(null);
    const prevScrollHeightRef = useRef(0);
    const prevMessageCountRef = useRef(messages.length);
    const wasPrependingRef = useRef(false);
    const [pullArmed, setPullArmed] = useState(false);
    const [menu, setMenu] = useState(null); // { message, x, y } | null
    const [selectedIds, setSelectedIds] = useState([]);
    const [forwardingMessage, setForwardingMessage] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const selectedMessages = selectedIds
        .map((id) => messages.find((message) => message.id === id))
        .filter(Boolean);
    const canDeleteSelection = selectedMessages.length > 0 && selectedMessages.every((message) => message.from === "me" && !message.deleted);

    const isRefreshing = refreshingChatId === chatId;
    const isTyping = typingChatId === chatId;

    const normalizedSearch = searchQuery.trim().toLowerCase();
    const searchMatches = normalizedSearch
        ? messages.reduce((acc, message, index) => {
              if (message.text?.toLowerCase().includes(normalizedSearch)) acc.push(index);
              return acc;
          }, [])
        : [];

    useEffect(() => {
        onSearchMatches?.(searchMatches.length);
    }, [searchMatches.length, onSearchMatches]);

    useEffect(() => {
        if (!normalizedSearch || !searchMatches.length) return;
        const targetIndex = searchMatches[Math.min(searchIndex, searchMatches.length - 1)];
        const node = contentRef.current?.querySelector(`[data-message-index="${targetIndex}"]`);
        node?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, [normalizedSearch, searchIndex, searchMatches.join(",")]);

    useRubberband(scrollRef, contentRef);

    // Reset scroll to bottom whenever the open chat changes.
    useEffect(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
        prevMessageCountRef.current = messages.length;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chatId]);

    const handleScroll = () => {
        const el = scrollRef.current;
        if (!el) return;

        if (el.scrollTop <= REFRESH_TRIGGER_PX && hasMoreOlder(chatId) && !isRefreshing) {
            setPullArmed(true);
            prevScrollHeightRef.current = el.scrollHeight;
            wasPrependingRef.current = true;
            loadOlderMessages(chatId);
        }
    };

    // Preserve scroll position after older messages are prepended; otherwise
    // (new message sent/received) stick to the bottom.
    useLayoutEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        const grew = messages.length > prevMessageCountRef.current;
        prevMessageCountRef.current = messages.length;

        if (wasPrependingRef.current && !isRefreshing) {
            const delta = el.scrollHeight - prevScrollHeightRef.current;
            el.scrollTop = delta > 0 ? delta + REFRESH_TRIGGER_PX : el.scrollTop;
            wasPrependingRef.current = false;
            setPullArmed(false);
        } else if (grew && !wasPrependingRef.current) {
            el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        }
    }, [messages, isRefreshing]);

    useLayoutEffect(() => {
        if (!isTyping) return;
        const el = scrollRef.current;
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, [isTyping]);

    const openMenuFor = (message, x, y) => setMenu({ message, x, y });
    const closeMenu = () => setMenu(null);

    const handleCopy = (message) => {
        navigator.clipboard?.writeText(message.text).catch(() => { });
        onNotify?.("Message copied");
    };
    const handleReply = (message) => onReply?.(message);
    const handleForward = (message) => setForwardingMessage(message);
    const handleSelect = (message) => {
        if (message.deleted) {
            setMenu(null);
            return;
        }
        setSelectedIds((prev) => prev.includes(message.id) ? prev.filter((id) => id !== message.id) : [...prev, message.id]);
        setMenu(null);
    };

    const scrollToMessage = (messageId) => {
        const node = contentRef.current?.querySelector(`[data-message-id="${messageId}"]`);
        if (!node) return;
        node.scrollIntoView({ block: "center", behavior: "smooth" });
        node.classList.add("ring-2", "ring-[var(--accent)]", "ring-offset-2", "ring-offset-[var(--bg)]");
        window.setTimeout(() => {
            node.classList.remove("ring-2", "ring-[var(--accent)]", "ring-offset-2", "ring-offset-[var(--bg)]");
        }, 900);
    };
    const handleDelete = (message) => setDeleteTarget(message);
    const toggleSelected = (id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    const clearSelection = () => setSelectedIds([]);

    return (
        <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="relative scroll-thin h-full overflow-y-auto px-3 sm:px-5 pt-20 pb-20"
            style={{ background: "var(--bg)" }}
        >
            {selectedIds.length > 0 && (
                <div className="sticky top-2 z-20 mx-auto mb-2 flex max-w-3xl items-center justify-between rounded-2xl border px-3 py-2 shadow-[var(--shadow-sm)]" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={clearSelection} className="grid h-7 w-7 place-items-center rounded-full" style={{ color: "var(--text-muted)" }} aria-label="Cancel selection"><X size={16} /></button>
                        <span className="text-[13px] font-medium" style={{ color: "var(--text)" }}>{selectedIds.length} selected</span>
                    </div>
                    {canDeleteSelection && (
                        <button
                            type="button"
                            onClick={() => setDeleteTarget(selectedMessages)}
                            className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold"
                            style={{ background: "var(--danger-soft, rgba(239,68,68,.12))", color: "var(--danger, #ef4444)" }}
                            aria-label="Delete selected messages"
                        >
                            <Trash2 size={14} />
                            Delete
                        </button>
                    )}
                </div>
            )}
            <div ref={contentRef}>
                <div className="flex justify-center pb-2 h-8 -mt-2">
                    {(isRefreshing || pullArmed) && (
                        <div
                            className="anim-pull-in flex items-center gap-2 rounded-full px-3 py-1.5 text-xs"
                            style={{ background: "var(--surface)", color: "var(--text-muted)", boxShadow: "var(--shadow-sm)" }}
                        >
                            <RefreshCw size={13} className="anim-spin" />
                            Loading earlier messages
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-2.5 max-w-3xl mx-auto">
                    {messages.map((m, i) => (
                        <div data-message-index={i} data-message-id={m.id} key={`${m.id}-wrap`}>
                        <MessageBubble
                            key={m.id}
                            message={m}
                            animate={i === messages.length - 1}
                            showAuthor={isGroup && m.from === "them"}
                            onMenu={openMenuFor}
                            onReplyNavigate={scrollToMessage}
                            selected={selectedIds.includes(m.id)}
                            selectMode={selectedIds.length > 0}
                            onToggleSelect={toggleSelected}
                            searchActive={searchMatches.includes(i) && searchMatches[searchIndex] === i}
                        />
                        </div>
                    ))}
                    {isTyping && <TypingIndicator />}
                </div>
            </div>

            {menu && (
                <MessageContextMenu
                    x={menu.x}
                    y={menu.y}
                    onClose={closeMenu}
                    onReply={() => { handleReply(menu.message); closeMenu(); }}
                    onCopy={() => handleCopy(menu.message)}
                    onForward={() => { handleForward(menu.message); closeMenu(); }}
                    onSelect={() => handleSelect(menu.message)}
                    canDelete={menu.message.from === "me" && !menu.message.deleted}
                    onDelete={() => { handleDelete(menu.message); closeMenu(); }}
                />
            )}

            <ConfirmModal
                open={Boolean(deleteTarget)}
                title={Array.isArray(deleteTarget) ? "Delete selected messages?" : "Delete message?"}
                message={Array.isArray(deleteTarget)
                    ? "These messages will be permanently removed for everyone in this conversation. This action can't be undone."
                    : "This message will be permanently removed for everyone in this conversation. This action can't be undone."}
                confirmLabel="Delete"
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => {
                    const targets = Array.isArray(deleteTarget) ? deleteTarget : [deleteTarget];
                    targets.forEach((message) => deleteMessage(chatId, message.id));
                    onNotify?.(targets.length > 1 ? `${targets.length} messages deleted` : "Message deleted");
                    setDeleteTarget(null);
                    setSelectedIds([]);
                }}
            />

            <ForwardModal
                open={Boolean(forwardingMessage)}
                message={forwardingMessage}
                contacts={contacts}
                currentChatId={chatId}
                onClose={() => setForwardingMessage(null)}
                onForward={(targetId, message) => {
                    forwardMessage(targetId, message);
                    onNotify?.("Message forwarded");
                }}
            />
        </div>
    );
}
