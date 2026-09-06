import { Search, X, SendHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import Avatar from "./Avatar";

export default function ForwardModal({ open, message, contacts, currentChatId, onClose, onForward }) {
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState(null);

  // Hooks must run on every render. Keep this before the conditional return.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contacts.filter((c) => c.id !== currentChatId && (!q || c.name.toLowerCase().includes(q)));
  }, [contacts, currentChatId, query]);

  if (!open || !message) return null;

  const submit = () => {
    if (!target) return;
    onForward?.(target.id, message);
    onClose?.();
    setTarget(null);
    setQuery("");
  };

  return (
    <div className="fixed inset-0 z-[290] flex items-center justify-center bg-black/45 px-4" onMouseDown={onClose}>
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border shadow-[var(--shadow-lg)]" style={{ background: "var(--surface)", borderColor: "var(--border)" }} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
          <h3 className="text-[15px] font-semibold" style={{ color: "var(--text)" }}>Forward message</h3>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full" style={{ color: "var(--text-muted)" }}><X size={17} /></button>
        </div>
        <div className="px-4 pt-3">
          <div className="rounded-xl border px-3 py-2 text-[13px]" style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--surface-2)" }}>
            {message.text}
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-xl border px-3 py-2" style={{ borderColor: "var(--border)" }}>
            <Search size={15} style={{ color: "var(--text-faint)" }} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search chats" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none" style={{ color: "var(--text)" }} />
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto px-2 py-2">
          {filtered.map((contact) => (
            <button key={contact.id} type="button" onClick={() => setTarget(contact)} className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left" style={{ background: target?.id === contact.id ? "var(--accent-soft)" : "transparent" }}>
              <Avatar name={contact.name} initials={contact.initials} color={contact.color} size="sm" />
              <span className="min-w-0 flex-1 truncate text-[13.5px]" style={{ color: "var(--text)" }}>{contact.name}</span>
            </button>
          ))}
          {!filtered.length && <p className="px-3 py-6 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>No chats found</p>}
        </div>
        <div className="flex justify-end gap-2 border-t px-4 py-3" style={{ borderColor: "var(--border)" }}>
          <button type="button" onClick={onClose} className="rounded-xl px-3.5 py-2 text-[13px]" style={{ color: "var(--text-muted)", background: "var(--surface-2)" }}>Cancel</button>
          <button type="button" disabled={!target} onClick={submit} className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-semibold disabled:opacity-40" style={{ background: "var(--accent)", color: "var(--accent-text)" }}><SendHorizontal size={15} />Forward</button>
        </div>
      </div>
    </div>
  );
}
