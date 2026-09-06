import Avatar from "./Avatar";
import { useChat } from "../context/ChatContext";

export default function ChatListItem({ contact, active, onSelect }) {
  const { messagesByChat, unreadCounts, typingChatId } = useChat();
  const messages = messagesByChat[contact.id] || [];
  const last = messages[messages.length - 1];
  const unread = unreadCounts[contact.id] || 0;
  const isTyping = typingChatId === contact.id;

  return (
    <button
      onClick={() => onSelect(contact.id)}
      className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors"
      style={{ background: active ? "var(--accent-soft)" : "transparent" }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = "var(--surface-hover)";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    >
      <Avatar name={contact.name} initials={contact.initials} color={contact.color} showPresence={!contact.isGroup} online={contact.online} />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-[14px] font-medium" style={{ color: "var(--text)" }}>
            {contact.name}
          </p>
          {last && (
            <span className="shrink-0 text-[11px]" style={{ color: unread ? "var(--accent)" : "var(--text-faint)" }}>
              {last.time}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p
            className="truncate text-[13px]"
            style={{ color: isTyping ? "var(--accent)" : "var(--text-muted)" }}
          >
            {isTyping ? "typing…" : last ? `${last.from === "me" ? "You: " : ""}${last.text}` : "No messages yet"}
          </p>
          {unread > 0 && (
            <span
              className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full px-1 text-[11px] font-medium"
              style={{ background: "var(--accent)", color: "var(--accent-text)" }}
            >
              {unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
