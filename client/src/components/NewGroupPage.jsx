import { useMemo, useState } from "react";
import { ArrowLeft, Check, Search, Users } from "lucide-react";
import Avatar from "./Avatar";
import { useChat } from "../context/ChatContext";

export default function NewGroupPage({ onBack }) {
  const { contacts, createGroup } = useChat();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState([]);
  const [groupName, setGroupName] = useState("");

  const people = useMemo(() => contacts.filter((c) => !c.isGroup), [contacts]);
  const filtered = useMemo(() => {
    if (!query.trim()) return people;
    const q = query.toLowerCase();
    return people.filter((c) => c.name.toLowerCase().includes(q));
  }, [people, query]);

  const toggle = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleCreate = () => {
    if (selected.length < 2 || !groupName.trim()) return;
    createGroup(groupName, selected);
    onBack();
  };

  const canCreate = selected.length >= 2 && groupName.trim().length > 0;

  return (
    <div className="flex h-full min-h-0 flex-col anim-mobile-page-in" style={{ background: "var(--surface)" }}>
      <div className="flex shrink-0 items-center gap-3 px-4 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <button onClick={onBack} className="grid h-9 w-9 place-items-center rounded-full transition-transform active:scale-90" style={{ background: "var(--bg)", color: "var(--text)" }} aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="text-[16px] font-semibold" style={{ color: "var(--text)" }}>New Group</p>
          <p className="text-[11.5px]" style={{ color: "var(--text-muted)" }}>Choose people and name your group</p>
        </div>
      </div>

      <div className="shrink-0 px-4 pt-4">
        <div className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <Search size={15} style={{ color: "var(--text-faint)" }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search people" className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[var(--text-faint)]" style={{ color: "var(--text)" }} />
        </div>
        {selected.length > 0 && (
          <p className="mt-2.5 text-[12px]" style={{ color: "var(--text-muted)" }}>
            {selected.length} selected — pick at least 2 to make a group
          </p>
        )}
      </div>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {filtered.length === 0 ? (
          <p className="pt-8 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>No people match “{query}”</p>
        ) : (
          <div className="mx-auto flex w-full max-w-xl flex-col gap-1">
            {filtered.map((c) => {
              const isSelected = selected.includes(c.id);
              return (
                <button key={c.id} onClick={() => toggle(c.id)} className="flex w-full items-center gap-3 rounded-2xl px-2.5 py-2.5 text-left transition-colors" style={{ background: isSelected ? "var(--accent-soft)" : "transparent" }}>
                  <Avatar name={c.name} initials={c.initials} color={c.color} size="sm" showPresence online={c.online} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium" style={{ color: "var(--text)" }}>{c.name}</p>
                    {c.role && <p className="truncate text-[12px]" style={{ color: "var(--text-muted)" }}>{c.role}</p>}
                  </div>
                  <div className="grid h-5 w-5 shrink-0 place-items-center rounded-full" style={{ background: isSelected ? "var(--accent)" : "transparent", border: isSelected ? "none" : "1.5px solid var(--border)" }}>
                    {isSelected && <Check size={12} strokeWidth={3} color="var(--accent-text)" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="shrink-0 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="mx-auto w-full max-w-xl">
          <div className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <Users size={15} style={{ color: "var(--text-faint)" }} />
            <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Group name" className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[var(--text-faint)]" style={{ color: "var(--text)" }} />
          </div>
          <button onClick={handleCreate} disabled={!canCreate} className="mt-3 w-full rounded-2xl py-3 text-[13.5px] font-semibold transition-opacity active:scale-[0.98]" style={{ background: "var(--accent)", color: "var(--accent-text)", opacity: canCreate ? 1 : 0.45 }}>Create Group</button>
        </div>
      </div>
    </div>
  );
}
