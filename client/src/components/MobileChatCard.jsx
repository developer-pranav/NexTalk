import Avatar from "./Avatar";

export default function MobileChatCard({ contact, unread, isTyping, lastMessage, onSelect, delay = 0 }) {
  return (
    <button
      onClick={() => onSelect(contact.id)}
      className="anim-pop-in flex w-full items-center gap-3 rounded-3xl px-3.5 py-3 text-left transition-transform active:scale-[0.98]"
      style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)", animationDelay: `${delay}ms` }}
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
