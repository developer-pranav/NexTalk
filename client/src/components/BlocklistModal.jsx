import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import Avatar from "./Avatar";

export default function BlocklistModal({ open, users, loading, unblockingId, onClose, onUnblock }) {
    useEffect(() => {
        if (!open) return undefined;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [open]);

    if (!open || typeof document === "undefined") return null;

    return createPortal(
        <div
            style={{
                position: "fixed",
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                zIndex: 2147483647,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "16px",
                isolation: "isolate",
            }}
            onClick={onClose}
        >
            <div
                aria-hidden="true"
                style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.68)" }}
            />

            <section
                role="dialog"
                aria-modal="true"
                aria-label="Blocked users"
                onClick={(event) => event.stopPropagation()}
                style={{
                    position: "relative",
                    zIndex: 1,
                    width: "100%",
                    maxWidth: "440px",
                    maxHeight: "min(620px, calc(100vh - 32px))",
                    overflow: "hidden",
                    borderRadius: "24px",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    boxShadow: "0 24px 80px rgba(0,0,0,.45)",
                }}
            >
                <header className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                    <div>
                        <p className="text-[15px] font-semibold" style={{ color: "var(--text)" }}>Blocklist</p>
                        <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>{users.length} blocked users</p>
                    </div>
                    <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full" style={{ color: "var(--text-muted)" }} aria-label="Close blocklist">
                        <X size={18} />
                    </button>
                </header>

                <div className="max-h-[500px] overflow-y-auto p-4">
                    {loading ? (
                        <p className="py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>Loading blocked users...</p>
                    ) : users.length === 0 ? (
                        <p className="py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>Your blocklist is empty.</p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {users.map((person) => {
                                const id = person._id || person.id;
                                const name = person.fullname || person.username || "User";
                                const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
                                return (
                                    <div key={id} className="flex items-center gap-3 rounded-2xl p-3" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                                        <Avatar name={name} initials={initials} src={person.avatar} size="md" />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium" style={{ color: "var(--text)" }}>{name}</p>
                                            <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>@{person.username || "user"}</p>
                                        </div>
                                        <button type="button" disabled={unblockingId === id} onClick={() => onUnblock(id)} className="rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-50" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                                            {unblockingId === id ? "..." : "Unblock"}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>
        </div>,
        document.body
    );
}
