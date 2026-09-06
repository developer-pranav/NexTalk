import { X } from "lucide-react";
import Avatar from "./Avatar";
import { useChat } from "../context/ChatContext";
import { currentUser } from "../data/dummyData";

/**
 * Shows the OTHER person's (or group's) profile — distinct from
 * ProfilePopup, which only ever shows the signed-in user's own profile.
 * Opened by tapping the name/avatar in the chat header.
 */
export default function ContactProfilePopup({ open, contact, onClose }) {
  const { contacts } = useChat();
  if (!open || !contact) return null;

  const members = contact.isGroup
    ? (contact.memberIds || []).map((id) => contacts.find((c) => c.id === id)).filter(Boolean)
    : [];

  const subtitle = contact.isGroup
    ? `${contact.members} members`
    : contact.online
    ? "Active now"
    : contact.lastSeen
    ? `Last seen ${contact.lastSeen}`
    : "Offline";

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 anim-fade-in" style={{ background: "rgba(0,0,0,0.32)" }} onClick={onClose} />

      <div
        className="anim-pop-in absolute left-1/2 top-1/2 flex max-h-[80vh] w-[92vw] max-w-[380px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl"
        style={{ background: "var(--surface)", boxShadow: "var(--shadow-lg)", border: "1px solid var(--border)" }}
      >
        <div className="flex shrink-0 items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <p className="text-[15px] font-semibold" style={{ color: "var(--text)" }}>
            {contact.isGroup ? "Group Info" : "Contact Info"}
          </p>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-[var(--surface-hover)] transition-colors"
            style={{ color: "var(--text-muted)" }}
            aria-label="Close profile"
          >
            <X size={18} />
          </button>
        </div>

        <div className="scroll-thin flex-1 overflow-y-auto px-5 py-5">
          <div
            className="flex flex-col items-center rounded-3xl px-5 py-6 text-center"
            style={{ background: "var(--bg)", boxShadow: "var(--shadow-sm)" }}
          >
            <Avatar name={contact.name} initials={contact.initials} color={contact.color} size="2xl" />
            <p className="mt-3 text-[17px] font-semibold" style={{ color: "var(--text)" }}>
              {contact.name}
            </p>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
              {contact.isGroup ? subtitle : contact.role || subtitle}
            </p>
            {!contact.isGroup && contact.role && (
              <p className="mt-0.5 text-[12px]" style={{ color: "var(--text-faint)" }}>
                {subtitle}
              </p>
            )}
          </div>

          {contact.isGroup && (
            <div className="mt-5">
              <p className="mb-2 text-[12px] font-medium uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
                {contact.members} Members
              </p>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3 rounded-2xl px-2.5 py-2">
                  <Avatar name={currentUser.name} initials={currentUser.initials} color={currentUser.color} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium" style={{ color: "var(--text)" }}>
                      You
                    </p>
                  </div>
                </div>
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 rounded-2xl px-2.5 py-2">
                    <Avatar name={m.name} initials={m.initials} color={m.color} size="sm" showPresence online={m.online} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium" style={{ color: "var(--text)" }}>
                        {m.name}
                      </p>
                      {m.role && (
                        <p className="truncate text-[12px]" style={{ color: "var(--text-muted)" }}>
                          {m.role}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
