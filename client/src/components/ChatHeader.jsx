import { useRef } from "react";
import { ArrowLeft, MoreVertical } from "lucide-react";
import Avatar from "./Avatar";

export default function ChatHeader({ contact, onBack, typing, onOpenContactProfile, onOpenMenu }) {
  const menuBtnRef = useRef(null);

  const showOnlineStatus =
    !contact.isGroup &&
    !contact.blockedByMe &&
    !contact.blockedByOther;

  const subtitle = typing
    ? "typing…"
    : contact.isGroup
    ? `${contact.members} members`
    : showOnlineStatus && contact.online
    ? "Active now"
    : "Offline";

  return (
    <div className="px-3 pt-3 pb-2 sm:px-5">
      <div className="flex items-center justify-between gap-2">
        {/* Identity capsule */}
        <button
          onClick={() => onOpenContactProfile?.(contact)}
          className="flex min-h-14 min-w-0 items-center gap-3 rounded-full py-2 pl-2 pr-5 text-left transition-colors hover:bg-[var(--surface-hover)]"
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
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full active:scale-90 transition-transform"
              style={{ color: "var(--text)" }}
              aria-label="Back to chats"
            >
              <ArrowLeft size={18} />
            </span>
          )}

          <Avatar name={contact.name} initials={contact.initials} color={contact.color} size="md" showPresence={showOnlineStatus} online={showOnlineStatus && contact.online} />

          <div className="min-w-0">
            <p className="truncate text-[15.5px] font-medium leading-tight" style={{ color: "var(--text)" }}>
              {contact.name}
            </p>
            <p className="truncate text-[12.5px] leading-tight" style={{ color: typing ? "var(--accent)" : "var(--text-muted)" }}>
              {subtitle}
            </p>
          </div>
        </button>

        {/* Actions capsule */}
        <div
          className="flex h-14 shrink-0 items-center gap-0.5 rounded-full p-1"
          style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" }}
        >
          <button
            ref={menuBtnRef}
            onClick={() => onOpenMenu?.(menuBtnRef.current?.getBoundingClientRect())}
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-[var(--surface-hover)] transition-colors"
            style={{ color: "var(--text-muted)" }}
            aria-label="More options"
          >
            <MoreVertical size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
