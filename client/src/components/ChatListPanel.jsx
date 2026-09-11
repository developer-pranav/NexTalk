import { useMemo, useRef, useState } from "react";
import HomeHeader from "./HomeHeader";
import ChatCard from "./ChatCard";
import ChatListOptionsMenu from "./ChatListOptionsMenu";
import { useChat } from "../context/ChatContext";
import { useRubberband } from "../hooks/useRubberband";
import ConfirmModal from "./ConfirmModal";

export default function ChatListPanel({ activeChatId, onSelect, onNewChat }) {
  const {
    contacts,
    messagesByChat,
    unreadCounts,
    typingChatId,
    clearChat,
    toggleBlock,
    unfriend,
    contactsLoading,
    contactsError,
  } = useChat();
  const [query, setQuery] = useState("");
  const [contextMenu, setContextMenu] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const scrollRef = useRef(null);
  const contentRef = useRef(null);

  useRubberband(scrollRef, contentRef);

  const unreadTotal = useMemo(() => Object.values(unreadCounts).reduce((a, b) => a + b, 0), [unreadCounts]);

  const filtered = useMemo(() => {
    if (!query.trim()) return contacts;
    const q = query.toLowerCase();
    return contacts.filter((c) => c.name.toLowerCase().includes(q));
  }, [contacts, query]);

  const openContextMenu = (event, contact) => {
    event.preventDefault();
    setContextMenu({
      point: { x: event.clientX, y: event.clientY },
      contact,
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <HomeHeader unreadTotal={unreadTotal} query={query} onQueryChange={setQuery} onNewChat={onNewChat} />

      <div ref={scrollRef} className="scroll-thin flex-1 overflow-y-auto px-3 pb-3">
        <div ref={contentRef}>
          {contactsLoading ? (
            <p className="pt-10 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
              Loading chats…
            </p>
          ) : contactsError ? (
            <p className="pt-10 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
              {contactsError}
            </p>
          ) : filtered.length === 0 ? (
            <p className="pt-10 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
              {query ? `No chats match “${query}”` : "No chats yet"}
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filtered.map((c, i) => {
                const list = messagesByChat[c.id] || [];
                return (
                  <ChatCard
                    key={c.id}
                    contact={c}
                    unread={unreadCounts[c.id] || 0}
                    isTyping={typingChatId === c.id}
                    lastMessage={list[list.length - 1]}
                    onSelect={onSelect}
                    onContextMenu={openContextMenu}
                    delay={i * 30}
                    active={c.id === activeChatId}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {contextMenu && (
        <ChatListOptionsMenu
          point={contextMenu.point}
          contact={contextMenu.contact}
          onClose={() => setContextMenu(null)}
          onClearChat={clearChat}
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
