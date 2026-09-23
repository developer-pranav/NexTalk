import { useCallback, useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import ChatOptionsMenu from "./ChatOptionsMenu";
import ContactProfilePopup from "./ContactProfilePopup";
import Toast from "./Toast";
import ConfirmModal from "./ConfirmModal";
import ChatSearchBar from "./ChatSearchBar";
import { useChat } from "../context/ChatContext";

export function EmptyChatState() {
    return (
        <div
            className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center"
            style={{ background: "var(--bg)" }}
        >
            <div
                className="grid h-14 w-14 place-items-center rounded-full"
                style={{
                    background: "var(--accent-soft)",
                    color: "var(--accent)",
                }}
            >
                <MessageCircle size={24} />
            </div>

            <div>
                <p
                    className="text-[15px] font-medium"
                    style={{ color: "var(--text)" }}
                >
                    Select a conversation
                </p>

                <p
                    className="mt-1 max-w-[240px] text-[13px]"
                    style={{ color: "var(--text-muted)" }}
                >
                    Pick someone from your chats to see the conversation here.
                </p>
            </div>
        </div>
    );
}

export default function ChatWindow({ contact, onBack }) {
    const {
        messagesByChat,
        sendMessage,
        sendMediaMessage,
        editMessage,
        typingChatId,
        startTyping,
        stopTyping,
        markMessagesSeen,
        clearChat,
        toggleBlock,
        toggleMute,
        unfriend,
        messagesLoading,
        messagesError,
    } = useChat();

    const messages = messagesByChat[contact.id] || [];
    const isLoadingMessages = Boolean(messagesLoading[contact.id]) && messages.length === 0;
    const messageLoadError = messagesError[contact.id];

    const [toastMsg, setToastMsg] = useState("");
    const [contactProfileOpen, setContactProfileOpen] = useState(false);
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchIndex, setSearchIndex] = useState(0);
    const [searchCount, setSearchCount] = useState(0);
    const [replyTo, setReplyTo] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);
    const [mediaUploading, setMediaUploading] = useState(false);
    const [uploadName, setUploadName] = useState("");

    useEffect(() => {
        if (!toastMsg) return;

        const t = setTimeout(() => {
            setToastMsg("");
        }, 1600);

        return () => clearTimeout(t);
    }, [toastMsg]);

    const isBlocked = Boolean(contact.blocked);

    useEffect(() => {
        markMessagesSeen(contact.id);
    }, [contact.id, markMessagesSeen]);

    const handleSearchMatches = useCallback((count) => {
        setSearchCount(count);
        setSearchIndex((current) => (count ? Math.min(current, count - 1) : 0));
    }, []);

    const closeSearch = () => {
        setSearchOpen(false);
        setSearchQuery("");
        setSearchIndex(0);
        setSearchCount(0);
    };

    const nextSearch = () => {
        if (!searchCount) return;
        setSearchIndex((current) => (current + 1) % searchCount);
    };

    const previousSearch = () => {
        if (!searchCount) return;
        setSearchIndex((current) => (current - 1 + searchCount) % searchCount);
    };

    return (
        <div
            className="relative h-full min-h-0 overflow-hidden"
            style={{ background: "var(--bg)" }}
        >

            {isLoadingMessages ? (
                <div className="flex h-full items-center justify-center">
                    <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                        Loading messages…
                    </p>
                </div>
            ) : messageLoadError ? (
                <div className="flex h-full items-center justify-center">
                    <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                        {messageLoadError}
                    </p>
                </div>
            ) : (
                <MessageList
                    chatId={contact.id}
                    messages={messages}
                    isGroup={contact.isGroup}
                    onNotify={setToastMsg}
                    onReply={setReplyTo}
                    onEdit={setEditingMessage}
                    searchQuery={searchQuery}
                    searchIndex={searchIndex}
                    onSearchMatches={handleSearchMatches}
                    searchOpen={searchOpen}
                />
            )}


            <div
                className="
                    pointer-events-none
                    absolute
                    left-0
                    right-0
                    top-0
                    z-10
                    h-28
                "
                style={{
                    background: `linear-gradient(
                        to bottom,
                        rgba(var(--bg-rgb), 1) 0%,
                        rgba(var(--bg-rgb), 1) 10%,
                        rgba(var(--bg-rgb), 0.75) 60%,
                        rgba(var(--bg-rgb), 0.30) 78%,
                        rgba(var(--bg-rgb), 0) 100%
                    )`,
                }}
            />


            <div className="absolute inset-x-0 top-0 z-30">
                {mediaUploading && (
                    <div className="pointer-events-none absolute inset-x-3 top-[4px] z-50 flex justify-center sm:inset-x-5">
                        <div
                            className="flex w-full max-w-sm items-center gap-2 rounded-full border px-3 py-2 text-[12px] shadow-[var(--shadow-sm)] backdrop-blur-md"
                            style={{ background: "color-mix(in srgb, var(--surface) 92%, transparent)", borderColor: "var(--border)", color: "var(--text-muted)" }}
                        >
                            <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
                            <span className="min-w-0 flex-1 truncate">Uploading{uploadName ? ` · ${uploadName}` : "…"}</span>
                        </div>
                    </div>
                )}

                <ChatHeader
                    contact={contact}
                    onBack={onBack}
                    typing={typingChatId === contact.id}
                    onOpenContactProfile={() =>
                        setContactProfileOpen(true)
                    }
                    onOpenMenu={(rect) => setMenuAnchor(rect)}
                    onOpenSearch={() => setSearchOpen(true)}
                />

                {searchOpen && (
                    <ChatSearchBar
                        query={searchQuery}
                        onQueryChange={(value) => { setSearchQuery(value); setSearchIndex(0); }}
                        matchIndex={searchIndex}
                        matchCount={searchCount}
                        onPrev={previousSearch}
                        onNext={nextSearch}
                        onClose={closeSearch}
                    />
                )}
            </div>


            <div
                className="
                    pointer-events-none
                    absolute
                    left-0
                    right-0
                    bottom-0
                    z-10
                    h-34
                "
                style={{
                    background: `linear-gradient(
                        to bottom,
                        rgba(var(--bg-rgb), 0) 0%,
                        rgba(var(--bg-rgb), 0.22) 22%,
                        rgba(var(--bg-rgb), 0.55) 45%,
                        rgba(var(--bg-rgb), 0.85) 70%,
                        rgba(var(--bg-rgb), 1) 100%
                    )`,
                }}
            />

            <div className="absolute inset-x-0 bottom-0 z-20">
                <MessageInput
                    onSend={(text, reply) => {
                        sendMessage(contact.id, text, reply);
                        setReplyTo(null);
                    }}
                    onSendMedia={async (file) => {
                        const ok = await sendMediaMessage(contact.id, file);
                        if (ok) setToastMsg("Media sent");
                        return ok;
                    }}
                    onMediaUploading={(uploading, file) => {
                        setMediaUploading(uploading);
                        setUploadName(uploading ? (file?.name || "media") : "");
                    }}
                    editingMessage={editingMessage}
                    onCancelEdit={() => setEditingMessage(null)}
                    onEdit={(text) => {
                        if (editingMessage) {
                            editMessage(contact.id, editingMessage.id, text);
                            setEditingMessage(null);
                        }
                    }}
                    replyTo={replyTo}
                    onCancelReply={() => setReplyTo(null)}
                    disabled={isBlocked}
                    disabledMessage={`You've blocked ${contact.name}`}
                    onNotify={setToastMsg}
                    onTyping={(text) => {
                        if (text.trim()) startTyping(contact.id);
                        else stopTyping(contact.id);
                    }}
                />
            </div>

            <Toast message={toastMsg} />

            <ContactProfilePopup
                open={contactProfileOpen}
                contact={contact}
                onClose={() => setContactProfileOpen(false)}
            />

            {menuAnchor && (
                <ChatOptionsMenu
                    anchorRect={menuAnchor}
                    contact={contact}
                    onClose={() => setMenuAnchor(null)}
                    onNotify={setToastMsg}
                    onClearChat={clearChat}
                    onToggleMute={toggleMute}
                    onToggleBlock={toggleBlock}
                    onUnfriend={unfriend}
                    onRequestConfirm={(config) => setConfirmAction(config)}
                />
            )}

            <ConfirmModal
                open={Boolean(confirmAction)}
                title={confirmAction?.title}
                message={confirmAction?.message}
                confirmLabel={confirmAction?.confirmLabel}
                onClose={() => setConfirmAction(null)}
                onConfirm={() => {
                    confirmAction?.action?.();
                    setConfirmAction(null);
                }}
            />
        </div>
    );
}