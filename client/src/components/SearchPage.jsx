import { useMemo, useState } from "react";
import { ArrowLeft, Search, UserPlus, X } from "lucide-react";
import Avatar from "./Avatar";
import { useChat } from "../context/ChatContext";

export default function SearchPage({ onBack, onOpenChat }) {
    const { contacts } = useChat();
    const [query, setQuery] = useState("");

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return [];
        return contacts.filter((c) => `${c.name} ${c.role || ""}`.toLowerCase().includes(q));
    }, [contacts, query]);

    return (
        <div className="flex h-full min-h-0 flex-col" style={{ background: "var(--bg)" }}>
            <div className="shrink-0 px-4 pb-3 pt-5">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button type="button" onClick={onBack} className="grid h-10 w-10 shrink-0 place-items-center rounded-full" style={{ background: "var(--surface)", color: "var(--text)", boxShadow: "var(--shadow-sm)" }}>
                            <ArrowLeft size={18} />
                        </button>
                    )}
                    <div>
                        <h1 className="text-[25px] font-semibold tracking-tight" style={{ color: "var(--text)" }}>Search</h1>
                        <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Find people and start a conversation</p>
                    </div>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-2xl px-3.5 py-3" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
                    <Search size={17} style={{ color: "var(--text-faint)" }} />
                    <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search people…" className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[var(--text-faint)]" style={{ color: "var(--text)" }} />
                    {query && <button type="button" onClick={() => setQuery("")} style={{ color: "var(--accent)" }}><X size={16} /></button>}
                </div>
            </div>

            <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 pb-32">
                {!query.trim() ? (
                    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                        <div className="grid h-14 w-14 place-items-center rounded-full" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}><Search size={23} /></div>
                        <p className="mt-3 text-[14px] font-medium" style={{ color: "var(--text)" }}>Search for someone new</p>
                        <p className="mt-1 max-w-[260px] text-[12.5px]" style={{ color: "var(--text-muted)" }}>Type a name or role above to find people in your network.</p>
                    </div>
                ) : results.length === 0 ? (
                    <div
                        className="pt-12 text-center text-[13px]"
                        style={{ color: "var(--text-muted)" }}
                    >
                        No people found for &ldquo;{query}&rdquo;
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {results.map((contact) => (
                            <button key={contact.id} type="button" onClick={() => onOpenChat?.(contact.id)} className="flex items-center gap-3 rounded-2xl p-3 text-left transition-transform active:scale-[0.99]" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                <Avatar name={contact.name} initials={contact.initials} color={contact.color} size="md" showPresence={!contact.isGroup} online={contact.online} />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-[14px] font-medium" style={{ color: "var(--text)" }}>{contact.name}</span>
                                    <span className="block truncate text-[12px]" style={{ color: "var(--text-muted)" }}>{contact.role || (contact.isGroup ? `${contact.members} members` : contact.online ? "Active now" : "Offline")}</span>
                                </span>
                                <UserPlus size={17} style={{ color: "var(--accent)" }} />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
