import Avatar from "./Avatar";

export default function ChatCard({ contact, unread, isTyping, lastMessage, onSelect, onContextMenu, delay = 0, active = false }) {
  return (
    <button
      onClick={() => onSelect(contact.id)}
      onContextMenu={(event) => {
        event.preventDefault();
        onContextMenu?.(event, contact);
      }}
      className="anim-pop-in flex w-full items-center gap-3 rounded-3xl px-3.5 py-3 text-left transition-transform active:scale-[0.98]"
      style={{
        background: active ? "var(--accent-soft)" : "var(--surface)",
        boxShadow: active ? "none" : "var(--shadow-sm)",
        border: active ? "1px solid var(--accent)" : "1px solid transparent",
        animationDelay: `${delay}ms`,
      }}
    >
      <div
        className="shrink-0 rounded-full p-[2.5px]"
        style={{ border: `2px solid ${contact.color}55` }}
      >
        <Avatar name={contact.name} initials={contact.initials} color={contact.color} size="md" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-[14.5px] font-semibold" style={{ color: "var(--text)" }}>
            {contact.name}
          </p>
          {lastMessage && (
            <span className="shrink-0 text-[11px]" style={{ color: "var(--text-faint)" }}>
              {lastMessage.time}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p
            className="truncate text-[13px]"
            style={{ color: isTyping ? "var(--accent)" : "var(--text-muted)" }}
          >
            {isTyping
              ? "typing…"
              : lastMessage
              ? `${lastMessage.from === "me" ? "You: " : ""}${lastMessage.text}`
              : "No messages yet"}
          </p>
          {unread > 0 && (
            <span
              className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full px-1 text-[10.5px] font-semibold"
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
