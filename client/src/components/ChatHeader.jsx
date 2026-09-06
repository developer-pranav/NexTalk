import { useRef } from "react";
import { ArrowLeft, MoreVertical, Search } from "lucide-react";
import Avatar from "./Avatar";

export default function ChatHeader({ contact, onBack, typing, onOpenContactProfile, onOpenMenu, onOpenSearch }) {
  const menuBtnRef = useRef(null);

  const subtitle = typing
    ? "typing…"
    : contact.isGroup
    ? `${contact.members} members`
    : contact.online
    ? "Active now"
    : contact.lastSeen
    ? `Last seen ${contact.lastSeen}`
    : "Offline";

  return (
    <div className="px-3 pt-3 pb-2 sm:px-5">
      <div className="flex items-center justify-between gap-2">
        {/* Identity capsule */}
        <button
          onClick={() => onOpenContactProfile?.(contact)}
          className="flex min-w-0 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-left transition-colors hover:bg-[var(--surface-hover)]"
          style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" }}
          aria-label={`Open ${contact.isGroup ? "group" : "contact"} info`}
        >
          {onBack && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onBack();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onBack();
                }
              }}
              role="button"
              tabIndex={0}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full active:scale-90 transition-transform"
              style={{ color: "var(--text)" }}
              aria-label="Back to chats"
            >
              <ArrowLeft size={18} />
            </span>
          )}

          <Avatar name={contact.name} initials={contact.initials} color={contact.color} size="sm" showPresence={!contact.isGroup} online={contact.online} />

          <div className="min-w-0">
            <p className="truncate text-[14px] font-medium leading-tight" style={{ color: "var(--text)" }}>
              {contact.name}
            </p>
            <p className="truncate text-[11.5px] leading-tight" style={{ color: typing ? "var(--accent)" : "var(--text-muted)" }}>
              {subtitle}
            </p>
          </div>
        </button>

        {/* Actions capsule */}
        <div
          className="flex shrink-0 items-center gap-0.5 rounded-full p-1"
          style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" }}
        >
          <button
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-[var(--surface-hover)] transition-colors"
            style={{ color: "var(--text-muted)" }}
            onClick={() => onOpenSearch?.()}
            aria-label="Search in conversation"
          >
            <Search size={16} />
          </button>
          <button
            ref={menuBtnRef}
            onClick={() => onOpenMenu?.(menuBtnRef.current?.getBoundingClientRect())}
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-[var(--surface-hover)] transition-colors"
            style={{ color: "var(--text-muted)" }}
            aria-label="More options"
          >
            <MoreVertical size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
