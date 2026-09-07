import { useEffect, useMemo, useState } from "react";
import { Check, Search, Users, X } from "lucide-react";
import Avatar from "./Avatar";
import { useChat } from "../context/ChatContext";

const ANIMATION_MS = 300;

export default function NewGroupPopup({
    open,
    onClose,
    positionClassName = "",
    origin = null,
}) {
    const { contacts, createGroup } = useChat();

    const [mounted, setMounted] = useState(open);
    const [closing, setClosing] = useState(false);

    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState([]);
    const [groupName, setGroupName] = useState("");

    const people = useMemo(
        () => contacts.filter((c) => !c.isGroup),
        [contacts]
    );

    const filtered = useMemo(() => {
        if (!query.trim()) return people;

        const q = query.toLowerCase();

        return people.filter((c) =>
            c.name.toLowerCase().includes(q)
        );
    }, [people, query]);

    useEffect(() => {
        if (open) {
            setMounted(true);
            setClosing(false);
            return;
        }

        if (!mounted) return;

        setClosing(true);

        const timer = setTimeout(() => {
            setMounted(false);
            setClosing(false);
        }, ANIMATION_MS);

        return () => clearTimeout(timer);
    }, [open, mounted]);

    if (!mounted) return null;

    const toggle = (id) => {
        setSelected((prev) =>
            prev.includes(id)
                ? prev.filter((x) => x !== id)
                : [...prev, id]
        );
    };

    const reset = () => {
        setQuery("");
        setSelected([]);
        setGroupName("");
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleCreate = () => {
        if (
            selected.length < 2 ||
            !groupName.trim()
        ) {
            return;
        }

        createGroup(groupName, selected);
        reset();
        onClose();
    };

    const canCreate =
        selected.length >= 2 &&
        groupName.trim().length > 0;

    const animationStyle = origin
        ? {
            "--trigger-x": `${origin.x}px`,
            "--trigger-y": `${origin.y}px`,
        }
        : {};

    return (
        <div className="fixed inset-0 z-50">
            {/* Overlay */}
            <div
                className={`absolute inset-0 ${closing
                        ? "anim-modal-backdrop-out"
                        : "anim-modal-backdrop-in"
                    }`}
                style={{ background: "rgba(0,0,0,0.32)" }}
                onClick={handleClose}
            />

            {/* Center / fullscreen modal */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-0 md:p-4">
                <div
                    className={`pointer-events-auto flex flex-col overflow-hidden ${closing
                            ? "anim-modal-out"
                            : "anim-modal-in"
                        } ${positionClassName}`}
                    style={{
                        ...animationStyle,
                        background: "var(--surface)",
                        boxShadow: "var(--shadow-lg)",
                        border: "1px solid var(--border)",
                    }}
                >
                    {/* HEADER */}
                    <div
                        className="flex shrink-0 items-center justify-between px-5 py-4"
                        style={{
                            borderBottom:
                                "1px solid var(--border)",
                        }}
                    >
                        <p
                            className="text-[15px] font-semibold"
                            style={{ color: "var(--text)" }}
                        >
                            New Group
                        </p>

                        <button
                            onClick={handleClose}
                            className="grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-[var(--surface-hover)]"
                            style={{
                                color: "var(--text-muted)",
                            }}
                            aria-label="Close new group"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* SEARCH */}
                    <div className="shrink-0 px-5 pt-4">
                        <div
                            className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5"
                            style={{
                                background: "var(--bg)",
                                border:
                                    "1px solid var(--border)",
                            }}
                        >
                            <Search
                                size={15}
                                style={{
                                    color: "var(--text-faint)",
                                }}
                            />

                            <input
                                value={query}
                                onChange={(e) =>
                                    setQuery(e.target.value)
                                }
                                placeholder="Search people"
                                className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[var(--text-faint)]"
                                style={{
                                    color: "var(--text)",
                                }}
                            />
                        </div>

                        {selected.length > 0 && (
                            <p
                                className="mt-2.5 text-[12px]"
                                style={{
                                    color: "var(--text-muted)",
                                }}
                            >
                                {selected.length} selected — pick at least 2 to make a group
                            </p>
                        )}
                    </div>

                    {/* PEOPLE */}
                    <div className="scroll-thin flex-1 overflow-y-auto px-5 py-3">
                        {filtered.length === 0 ? (
                            <p
                                className="pt-8 text-center text-[13px]"
                                style={{
                                    color: "var(--text-muted)",
                                }}
                            >
                                No people match “{query}”
                            </p>
                        ) : (
                            <div className="flex flex-col gap-1">
                                {filtered.map((c) => {
                                    const isSelected =
                                        selected.includes(c.id);

                                    return (
                                        <button
                                            key={c.id}
                                            onClick={() =>
                                                toggle(c.id)
                                            }
                                            className="flex w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-left transition-colors"
                                            style={{
                                                background: isSelected
                                                    ? "var(--accent-soft)"
                                                    : "transparent",
                                            }}
                                        >
                                            <Avatar
                                                name={c.name}
                                                initials={c.initials}
                                                color={c.color}
                                                size="sm"
                                                showPresence
                                                online={c.online}
                                            />

                                            <div className="min-w-0 flex-1">
                                                <p
                                                    className="truncate text-[14px] font-medium"
                                                    style={{
                                                        color: "var(--text)",
                                                    }}
                                                >
                                                    {c.name}
                                                </p>

                                                {c.role && (
                                                    <p
                                                        className="truncate text-[12px]"
                                                        style={{
                                                            color:
                                                                "var(--text-muted)",
                                                        }}
                                                    >
                                                        {c.role}
                                                    </p>
                                                )}
                                            </div>

                                            <div
                                                className="grid h-5 w-5 shrink-0 place-items-center rounded-full"
                                                style={{
                                                    background: isSelected
                                                        ? "var(--accent)"
                                                        : "transparent",
                                                    border: isSelected
                                                        ? "none"
                                                        : "1.5px solid var(--border)",
                                                }}
                                            >
                                                {isSelected && (
                                                    <Check
                                                        size={12}
                                                        strokeWidth={3}
                                                        color="var(--accent-text)"
                                                    />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* FOOTER */}
                    <div
                        className="shrink-0 px-5 pb-5 pt-2"
                        style={{
                            borderTop:
                                "1px solid var(--border)",
                        }}
                    >
                        <div
                            className="mt-3 flex items-center gap-2 rounded-2xl px-3.5 py-2.5"
                            style={{
                                background: "var(--bg)",
                                border:
                                    "1px solid var(--border)",
                            }}
                        >
                            <Users
                                size={15}
                                style={{
                                    color: "var(--text-faint)",
                                }}
                            />

                            <input
                                value={groupName}
                                onChange={(e) =>
                                    setGroupName(e.target.value)
                                }
                                placeholder="Group name"
                                className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[var(--text-faint)]"
                                style={{
                                    color: "var(--text)",
                                }}
                            />
                        </div>

                        <button
                            onClick={handleCreate}
                            disabled={!canCreate}
                            className="mt-3 w-full rounded-2xl py-2.5 text-[13.5px] font-semibold transition-opacity active:scale-[0.98]"
                            style={{
                                background: "var(--accent)",
                                color: "var(--accent-text)",
                                opacity: canCreate ? 1 : 0.45,
                                cursor: canCreate
                                    ? "pointer"
                                    : "not-allowed",
                            }}
                        >
                            Create Group
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}