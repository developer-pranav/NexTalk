import { useState } from "react";
import {
    X,
    Image as ImageIcon,
    FileText,
    ChevronRight,
    ArrowLeft,
    Download,
    CalendarDays,
} from "lucide-react";
import Avatar from "./Avatar";
import { useChat } from "../context/ChatContext";
import { currentUser } from "../data/dummyData";

const sharedData = {
    u1: [
        { id: "s1", type: "image", name: "onboarding-flow.png", date: "Today", url: null },
        { id: "s2", type: "image", name: "empty-state.png", date: "Yesterday", url: null },
        { id: "s3", type: "file", name: "Project-notes.pdf", date: "Yesterday", url: null },
        { id: "s4", type: "image", name: "mobile-layout.png", date: "Mon", url: null },
        { id: "s5", type: "file", name: "Design-spec.pdf", date: "Mon", url: null },
    ],

    u2: [
        { id: "s1", type: "file", name: "api-documentation.pdf", date: "Today", url: null },
        { id: "s2", type: "image", name: "checkout-flow.png", date: "Yesterday", url: null },
        { id: "s3", type: "file", name: "deployment-notes.txt", date: "Mon", url: null },
    ],

    u3: [
        { id: "s1", type: "image", name: "safari-test.png", date: "Yesterday", url: null },
        { id: "s2", type: "file", name: "regression-report.pdf", date: "Mon", url: null },
    ],
};

function SharedPreview({ item }) {
    if (item.type === "image") {
        return (
            <div
                className="relative aspect-square w-full overflow-hidden rounded-xl"
                style={{ background: "var(--surface-hover)" }}
            >
                {item.url ? (
                    <img
                        src={item.url}
                        alt={item.name}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="grid h-full w-full place-items-center">
                        <ImageIcon
                            size={22}
                            style={{ color: "var(--text-muted)" }}
                        />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-xl p-2"
            style={{
                background: "var(--surface-hover)",
                border: "1px solid var(--border)",
            }}
        >
            <FileText
                size={24}
                style={{ color: "var(--accent)" }}
            />

            <p
                className="w-full truncate text-center text-[10px]"
                style={{ color: "var(--text-muted)" }}
            >
                {item.name}
            </p>
        </div>
    );
}

function SharedModal({ open, items, onClose }) {
    const [tab, setTab] = useState("all");

    if (!open) return null;

    const filtered =
        tab === "all"
            ? items
            : items.filter((item) => item.type === tab);

    return (
        <div className="fixed inset-0 z-[70]">
            <div
                className="absolute inset-0"
                style={{ background: "rgba(0,0,0,0.45)" }}
                onClick={onClose}
            />

            <div
                className="
                    anim-pop-in
                    absolute left-1/2 top-1/2
                    flex max-h-[82vh] w-[92vw] max-w-[430px]
                    -translate-x-1/2 -translate-y-1/2
                    flex-col overflow-hidden rounded-3xl
                "
                style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-lg)",
                }}
            >
                {/* Header */}
                <div
                    className="flex shrink-0 items-center gap-3 px-5 py-4"
                    style={{ borderBottom: "1px solid var(--border)" }}
                >
                    <button
                        onClick={onClose}
                        className="
                            grid h-8 w-8 shrink-0 place-items-center
                            rounded-full transition-colors
                            hover:bg-[var(--surface-hover)]
                        "
                        style={{ color: "var(--text-muted)" }}
                    >
                        <ArrowLeft size={18} />
                    </button>

                    <div className="min-w-0 flex-1">
                        <p
                            className="text-[15px] font-semibold"
                            style={{ color: "var(--text)" }}
                        >
                            Shared
                        </p>

                        <p
                            className="text-[12px]"
                            style={{ color: "var(--text-muted)" }}
                        >
                            {items.length} items
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="
                            grid h-8 w-8 place-items-center
                            rounded-full transition-colors
                            hover:bg-[var(--surface-hover)]
                        "
                        style={{ color: "var(--text-muted)" }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 px-5 py-3">
                    {[
                        ["all", "All"],
                        ["image", "Images"],
                        ["file", "Files"],
                    ].map(([value, label]) => (
                        <button
                            key={value}
                            onClick={() => setTab(value)}
                            className="rounded-full px-4 py-1.5 text-[12px] font-medium transition-colors"
                            style={{
                                background:
                                    tab === value
                                        ? "var(--accent)"
                                        : "var(--surface-hover)",
                                color:
                                    tab === value
                                        ? "#fff"
                                        : "var(--text-muted)",
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="scroll-thin flex-1 overflow-y-auto px-5 pb-5">
                    {filtered.length === 0 ? (
                        <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
                            <div
                                className="grid h-12 w-12 place-items-center rounded-full"
                                style={{
                                    background: "var(--surface-hover)",
                                    color: "var(--text-muted)",
                                }}
                            >
                                {tab === "file" ? (
                                    <FileText size={21} />
                                ) : (
                                    <ImageIcon size={21} />
                                )}
                            </div>

                            <p
                                className="mt-3 text-[14px] font-medium"
                                style={{ color: "var(--text)" }}
                            >
                                Nothing shared yet
                            </p>

                            <p
                                className="mt-1 text-[12px]"
                                style={{ color: "var(--text-muted)" }}
                            >
                                Shared files and images will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filtered.map((item) => (
                                <div
                                    key={item.id}
                                    className="
                                        flex items-center gap-3 rounded-2xl
                                        px-3 py-3 transition-colors
                                        hover:bg-[var(--surface-hover)]
                                    "
                                >
                                    <div
                                        className="
                                            grid h-11 w-11 shrink-0
                                            place-items-center overflow-hidden
                                            rounded-xl
                                        "
                                        style={{
                                            background:
                                                "var(--surface-hover)",
                                        }}
                                    >
                                        {item.type === "image" ? (
                                            item.url ? (
                                                <img
                                                    src={item.url}
                                                    alt={item.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <ImageIcon
                                                    size={19}
                                                    style={{
                                                        color: "var(--text-muted)",
                                                    }}
                                                />
                                            )
                                        ) : (
                                            <FileText
                                                size={20}
                                                style={{
                                                    color: "var(--accent)",
                                                }}
                                            />
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p
                                            className="truncate text-[13px] font-medium"
                                            style={{ color: "var(--text)" }}
                                        >
                                            {item.name}
                                        </p>

                                        <p
                                            className="mt-0.5 text-[11px]"
                                            style={{
                                                color: "var(--text-muted)",
                                            }}
                                        >
                                            {item.date}
                                        </p>
                                    </div>

                                    <button
                                        className="
                                            grid h-8 w-8 place-items-center
                                            rounded-full
                                            hover:bg-[var(--surface-hover)]
                                        "
                                        style={{
                                            color: "var(--text-muted)",
                                        }}
                                    >
                                        <Download size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ContactProfilePopup({
    open,
    contact,
    onClose,
}) {
    const { contacts } = useChat();

    const [sharedOpen, setSharedOpen] = useState(false);

    if (!open || !contact) return null;

    const members = contact.isGroup
        ? (contact.memberIds || [])
            .map((id) => contacts.find((c) => c.id === id))
            .filter(Boolean)
        : [];

    const subtitle = contact.isGroup
        ? `${contact.members} members`
        : contact.online
            ? "Active now"
            : contact.lastSeen
                ? `Last seen ${contact.lastSeen}`
                : "Offline";

    const sharedItems = sharedData[contact.id] || [];

    const recentShared = sharedItems.slice(0, 4);

    return (
        <>
            <div className="fixed inset-0 z-50">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 anim-fade-in"
                    style={{
                        background: "rgba(0,0,0,0.32)",
                    }}
                    onClick={onClose}
                />

                {/* Profile */}
                <div
                    className="
                        anim-pop-in
                        absolute left-1/2 top-1/2
                        flex max-h-[82vh] w-[92vw] max-w-[380px]
                        -translate-x-1/2 -translate-y-1/2
                        flex-col overflow-hidden rounded-3xl
                    "
                    style={{
                        background: "var(--surface)",
                        boxShadow: "var(--shadow-lg)",
                        border: "1px solid var(--border)",
                    }}
                >
                    {/* Header */}
                    <div
                        className="flex shrink-0 items-center justify-between px-5 py-4"
                        style={{
                            borderBottom: "1px solid var(--border)",
                        }}
                    >
                        <div>
                            <p
                                className="text-[15px] font-semibold"
                                style={{ color: "var(--text)" }}
                            >
                                Profile
                            </p>

                            <p
                                className="mt-0.5 text-[12px]"
                                style={{
                                    color: "var(--text-muted)",
                                }}
                            >
                                Contact details
                            </p>
                        </div>

                        <button
                            onClick={onClose}
                            className="
                                grid h-8 w-8 place-items-center
                                rounded-full transition-colors
                                hover:bg-[var(--surface-hover)]
                            "
                            style={{
                                color: "var(--text-muted)",
                            }}
                            aria-label="Close profile"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="scroll-thin flex-1 overflow-y-auto px-5 py-5">
                        {/* Profile card */}
                        <div
                            className="
                                relative flex flex-col items-center
                                overflow-hidden rounded-3xl
                                px-5 py-7 text-center
                            "
                            style={{
                                background: "var(--bg)",
                                border: "1px solid var(--border)",
                            }}
                        >

                            <div className="relative">
                                <Avatar
                                    name={contact.name}
                                    initials={contact.initials}
                                    color={contact.color}
                                    size="2xl"
                                />

                                {!contact.isGroup && contact.online && (
                                    <span
                                        className="
                                            absolute bottom-1 right-1
                                            h-3 w-3 rounded-full
                                        "
                                        style={{
                                            background: "#35c982",
                                            border:
                                                "2px solid var(--bg)",
                                        }}
                                    />
                                )}
                            </div>

                            <p
                                className="relative mt-4 text-[18px] font-semibold"
                                style={{
                                    color: "var(--text)",
                                }}
                            >
                                {contact.name}
                            </p>

                            <div className="relative mt-1 flex items-center gap-1.5">
                                {!contact.isGroup && contact.online && (
                                    <span
                                        className="h-1.5 w-1.5 rounded-full"
                                        style={{
                                            background: "#35c982",
                                        }}
                                    />
                                )}

                                <p
                                    className="text-[13px]"
                                    style={{
                                        color: "var(--text-muted)",
                                    }}
                                >
                                    {subtitle}
                                </p>
                            </div>
                        </div>

                        {/* Group members */}
                        {contact.isGroup && (
                            <div className="mt-5">
                                <div className="mb-2 flex items-center justify-between">
                                    <p
                                        className="text-[12px] font-medium uppercase tracking-wide"
                                        style={{
                                            color: "var(--text-faint)",
                                        }}
                                    >
                                        Members
                                    </p>

                                    <p
                                        className="text-[12px]"
                                        style={{
                                            color: "var(--text-muted)",
                                        }}
                                    >
                                        {contact.members}
                                    </p>
                                </div>

                                <div
                                    className="overflow-hidden rounded-2xl"
                                    style={{
                                        border:
                                            "1px solid var(--border)",
                                    }}
                                >
                                    <div
                                        className="flex items-center gap-3 px-3 py-3"
                                        style={{
                                            background:
                                                "var(--surface-hover)",
                                        }}
                                    >
                                        <Avatar
                                            name={currentUser.name}
                                            initials={currentUser.initials}
                                            color={currentUser.color}
                                            size="sm"
                                        />

                                        <div className="min-w-0 flex-1">
                                            <p
                                                className="truncate text-[13px] font-medium"
                                                style={{
                                                    color: "var(--text)",
                                                }}
                                            >
                                                You
                                            </p>
                                        </div>
                                    </div>

                                    {members.map((m) => (
                                        <div
                                            key={m.id}
                                            className="flex items-center gap-3 px-3 py-3"
                                            style={{
                                                borderTop:
                                                    "1px solid var(--border)",
                                            }}
                                        >
                                            <Avatar
                                                name={m.name}
                                                initials={m.initials}
                                                color={m.color}
                                                size="sm"
                                                showPresence
                                                online={m.online}
                                            />

                                            <div className="min-w-0 flex-1">
                                                <p
                                                    className="truncate text-[13px] font-medium"
                                                    style={{
                                                        color: "var(--text)",
                                                    }}
                                                >
                                                    {m.name}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Joined */}
                        {!contact.isGroup && (
                            <div className="mt-5">
                                <p
                                    className="mb-2 text-[12px] font-medium uppercase tracking-wide"
                                    style={{
                                        color: "var(--text-faint)",
                                    }}
                                >
                                    About
                                </p>

                                <div
                                    className="rounded-2xl px-4 py-3.5"
                                    style={{
                                        background: "var(--bg)",
                                        border: "1px solid var(--border)",
                                    }}
                                >
                                    <p
                                        className="text-[13px] leading-5"
                                        style={{ color: "var(--text-muted)" }}
                                    >
                                        {contact.about || "No bio added yet."}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Shared */}
                        {!contact.isGroup && (
                            <div className="mt-5">
                                <div className="mb-2 flex items-center justify-between">
                                    <p
                                        className="text-[12px] font-medium uppercase tracking-wide"
                                        style={{
                                            color: "var(--text-faint)",
                                        }}
                                    >
                                        Shared
                                    </p>

                                    {sharedItems.length > 0 && (
                                        <button
                                            onClick={() =>
                                                setSharedOpen(true)
                                            }
                                            className="
                                                flex items-center gap-0.5
                                                text-[12px] font-medium
                                            "
                                            style={{
                                                color: "var(--accent)",
                                            }}
                                        >
                                            View all
                                            <ChevronRight size={14} />
                                        </button>
                                    )}
                                </div>

                                {recentShared.length > 0 ? (
                                    <div className="grid w-full min-w-0 grid-cols-4 gap-2">
                                        {recentShared.slice(0, 4).map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() =>
                                                    setSharedOpen(true)
                                                }
                                                className="block w-full min-w-0 text-left"
                                            >
                                                <SharedPreview
                                                    item={item}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div
                                        className="
                                            flex items-center gap-3
                                            rounded-2xl px-4 py-4
                                        "
                                        style={{
                                            background: "var(--bg)",
                                            border:
                                                "1px solid var(--border)",
                                        }}
                                    >
                                        <div
                                            className="
                                                grid h-9 w-9
                                                place-items-center
                                                rounded-xl
                                            "
                                            style={{
                                                background:
                                                    "var(--surface-hover)",
                                                color:
                                                    "var(--text-muted)",
                                            }}
                                        >
                                            <ImageIcon size={17} />
                                        </div>

                                        <div>
                                            <p
                                                className="text-[13px] font-medium"
                                                style={{
                                                    color: "var(--text)",
                                                }}
                                            >
                                                No shared files yet
                                            </p>

                                            <p
                                                className="mt-0.5 text-[11px]"
                                                style={{
                                                    color:
                                                        "var(--text-muted)",
                                                }}
                                            >
                                                Images and files will appear here.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {!contact.isGroup && (
                            <div
                                className="mt-5 flex items-center gap-3 rounded-2xl px-4 py-3.5"
                                style={{
                                    background: "var(--bg)",
                                    border: "1px solid var(--border)",
                                }}
                            >
                                <div
                                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
                                    style={{
                                        background: "var(--surface-hover)",
                                        color: "var(--text-muted)",
                                    }}
                                >
                                    <CalendarDays size={17} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>
                                        Joined
                                    </p>
                                    <p className="mt-0.5 text-[13px] font-medium" style={{ color: "var(--text)" }}>
                                        {contact.joined || "21 Jan 2024"}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Shared modal */}
            <SharedModal
                open={sharedOpen}
                items={sharedItems}
                onClose={() => setSharedOpen(false)}
            />
        </>
    );
}