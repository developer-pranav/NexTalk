import { useMemo, useState } from "react";
import {
    ArrowLeft,
    Search,
    UserPlus,
    UserCheck,
    X,
    MessageCircle,
} from "lucide-react";
import Avatar from "./Avatar";
import { useChat } from "../context/ChatContext";
import { discoverablePeople } from "../data/dummyData";


function PersonPreview({
    person,
    isFriend,
    onClose,
    onOpenChat,
    onAddFriend,
    requestSent,
}) {
    return (
        <div className="fixed inset-0 z-[100]">
            {/* Backdrop */}
            <button
                type="button"
                aria-label="Close profile"
                onClick={onClose}
                className="absolute inset-0 cursor-default"
                style={{
                    background: "rgba(0, 0, 0, 0.52)",
                    border: "0",
                    padding: 0,
                }}
            />

            {/* Modal */}
            <div
                role="dialog"
                aria-modal="true"
                className="
                    absolute left-1/2 top-1/2
                    w-[calc(100vw-32px)]
                    max-w-[420px]
                    max-h-[calc(100vh-32px)]
                    -translate-x-1/2
                    -translate-y-1/2
                    overflow-hidden
                    rounded-[28px]
                    anim-pop-in
                "
                style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-lg)",
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-5 py-4"
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
                            style={{ color: "var(--text-muted)" }}
                        >
                            Contact details
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="
                            grid h-9 w-9 shrink-0 place-items-center
                            rounded-full
                            transition-colors
                            hover:bg-[var(--surface-hover)]
                            active:scale-95
                        "
                        style={{
                            color: "var(--text-muted)",
                        }}
                        aria-label="Close profile"
                    >
                        <X size={19} />
                    </button>
                </div>

                {/* Content */}
                <div className="scroll-thin max-h-[calc(100vh-105px)] overflow-y-auto px-5 py-5">

                    {/* Profile hero */}
                    <div
                        className="
                            relative
                            overflow-hidden
                            rounded-[24px]
                            px-5
                            py-7
                            text-center
                        "
                        style={{
                            background: "var(--bg)",
                            border: "1px solid var(--border)",
                        }}
                    >
                        {/* Decorative circle */}
                        <div
                            className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-40"
                            style={{
                                background: "var(--accent-soft)",
                            }}
                        />

                        <div className="relative flex flex-col items-center">
                            <Avatar
                                name={person.name}
                                initials={person.initials}
                                color={person.color}
                                size="2xl"
                                showPresence
                                online={person.online}
                            />

                            <p
                                className="mt-4 text-[19px] font-semibold tracking-tight"
                                style={{ color: "var(--text)" }}
                            >
                                {person.name}
                            </p>

                            <p
                                className="mt-1 text-[13px]"
                                style={{ color: "var(--text-muted)" }}
                            >
                                {person.role ||
                                    (person.online
                                        ? "Active now"
                                        : "Offline")}
                            </p>

                            <div
                                className="mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
                                style={{
                                    background: "var(--surface)",
                                    border: "1px solid var(--border)",
                                }}
                            >
                                <span
                                    className="h-1.5 w-1.5 rounded-full"
                                    style={{
                                        background: person.online
                                            ? "#35C77A"
                                            : "var(--text-faint)",
                                    }}
                                />

                                <span
                                    className="text-[11px]"
                                    style={{
                                        color: "var(--text-muted)",
                                    }}
                                >
                                    {person.online
                                        ? "Active now"
                                        : "Offline"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* About */}
                    <div
                        className="mt-4 rounded-[20px] px-4 py-3.5"
                        style={{
                            background: "var(--bg)",
                            border: "1px solid var(--border)",
                        }}
                    >
                        <p
                            className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.09em]"
                            style={{
                                color: "var(--text-faint)",
                            }}
                        >
                            About
                        </p>

                        <p
                            className="text-[13px] leading-5"
                            style={{
                                color: "var(--text-muted)",
                            }}
                        >
                            {person.about || "No bio added yet."}
                        </p>
                    </div>

                    {/* Non-friend state */}
                    {!isFriend && (
                        <>
                            <div
                                className="
                                    mt-3
                                    rounded-[18px]
                                    px-4
                                    py-3
                                "
                                style={{
                                    background: "var(--accent-soft)",
                                    border: "1px solid var(--border)",
                                }}
                            >
                                <p
                                    className="text-[12px] leading-5"
                                    style={{
                                        color: "var(--text-muted)",
                                    }}
                                >
                                    You need to be friends before you can
                                    start a conversation.
                                </p>
                            </div>

                            <button
                                type="button"
                                disabled={requestSent}
                                onClick={() => onAddFriend(person.id)}
                                className="
                                    mt-3
                                    flex
                                    w-full
                                    items-center
                                    justify-center
                                    gap-2
                                    rounded-[18px]
                                    px-4
                                    py-3
                                    text-[13px]
                                    font-semibold
                                    transition-all
                                    active:scale-[0.99]
                                    disabled:cursor-default
                                "
                                style={{
                                    background: requestSent
                                        ? "var(--surface-hover)"
                                        : "var(--accent)",
                                    color: requestSent
                                        ? "var(--text-muted)"
                                        : "#fff",
                                    border: "1px solid var(--border)",
                                }}
                            >
                                {requestSent ? (
                                    <>
                                        <UserCheck size={16} />
                                        Friend request sent
                                    </>
                                ) : (
                                    <>
                                        <UserPlus size={16} />
                                        Send friend request
                                    </>
                                )}
                            </button>
                        </>
                    )}

                    {/* Friend state */}
                    {isFriend && (
                        <button
                            type="button"
                            onClick={() => onOpenChat(person.id)}
                            className="
                                mt-3
                                flex
                                w-full
                                items-center
                                justify-center
                                gap-2
                                rounded-[18px]
                                px-4
                                py-3
                                text-[13px]
                                font-semibold
                                transition-all
                                active:scale-[0.99]
                            "
                            style={{
                                background: "var(--accent)",
                                color: "#fff",
                            }}
                        >
                            <MessageCircle size={16} />
                            Open chat
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}


export default function SearchPage({ onBack, onOpenChat }) {
    const { contacts } = useChat();

    const [query, setQuery] = useState("");
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [sentRequests, setSentRequests] = useState(() => new Set());

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();

        if (!q) return [];

        const allPeople = [...contacts, ...discoverablePeople];
        const seen = new Set();

        return allPeople.filter((person) => {
            if (seen.has(person.id)) return false;

            seen.add(person.id);

            return `${person.name} ${person.role || ""} ${
                person.about || ""
            }`
                .toLowerCase()
                .includes(q);
        });
    }, [contacts, query]);

    const friendIds = useMemo(
        () => new Set(contacts.map((contact) => contact.id)),
        [contacts]
    );

    const handleAddFriend = (id) => {
        setSentRequests((previous) => {
            const next = new Set(previous);
            next.add(id);
            return next;
        });
    };

    const openPerson = (person) => {
        if (friendIds.has(person.id)) {
            onOpenChat?.(person.id);
            return;
        }

        setSelectedPerson(person);
    };

    return (
        <div
            className="flex h-full min-h-0 flex-col"
            style={{ background: "var(--bg)" }}
        >
            {/* Search header */}
            <div className="shrink-0 px-4 pb-3 pt-5">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button
                            type="button"
                            onClick={onBack}
                            className="
                                grid h-10 w-10 shrink-0
                                place-items-center
                                rounded-full
                            "
                            style={{
                                background: "var(--surface)",
                                color: "var(--text)",
                                boxShadow: "var(--shadow-sm)",
                            }}
                        >
                            <ArrowLeft size={18} />
                        </button>
                    )}

                    <div>
                        <h1
                            className="text-[25px] font-semibold tracking-tight"
                            style={{ color: "var(--text)" }}
                        >
                            Search
                        </h1>

                        <p
                            className="text-[13px]"
                            style={{ color: "var(--text-muted)" }}
                        >
                            Find people and start a conversation
                        </p>
                    </div>
                </div>

                <div
                    className="mt-4 flex items-center gap-2 rounded-2xl px-3.5 py-3"
                    style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        boxShadow: "var(--shadow-sm)",
                    }}
                >
                    <Search
                        size={17}
                        style={{ color: "var(--text-faint)" }}
                    />

                    <input
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search people…"
                        className="
                            min-w-0
                            flex-1
                            bg-transparent
                            text-[14px]
                            outline-none
                            placeholder:text-[var(--text-faint)]
                        "
                        style={{ color: "var(--text)" }}
                    />

                    {query && (
                        <button
                            type="button"
                            onClick={() => setQuery("")}
                            className="transition-transform active:scale-90"
                            style={{ color: "var(--accent)" }}
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Results */}
            <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 pb-32">
                {!query.trim() ? (
                    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                        <div
                            className="grid h-14 w-14 place-items-center rounded-full"
                            style={{
                                background: "var(--accent-soft)",
                                color: "var(--accent)",
                            }}
                        >
                            <Search size={23} />
                        </div>

                        <p
                            className="mt-3 text-[14px] font-medium"
                            style={{ color: "var(--text)" }}
                        >
                            Search for someone new
                        </p>

                        <p
                            className="mt-1 max-w-[260px] text-[12.5px]"
                            style={{ color: "var(--text-muted)" }}
                        >
                            Find friends or discover people in your network.
                        </p>
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
                        {results.map((person) => {
                            const isFriend = friendIds.has(person.id);
                            const requestSent = sentRequests.has(person.id);

                            return (
                                <div
                                    key={person.id}
                                    className="
                                        flex
                                        items-center
                                        gap-3
                                        rounded-2xl
                                        p-3
                                    "
                                    style={{
                                        background: "var(--surface)",
                                        border: "1px solid var(--border)",
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={() => openPerson(person)}
                                        className="
                                            flex
                                            min-w-0
                                            flex-1
                                            items-center
                                            gap-3
                                            text-left
                                        "
                                    >
                                        <Avatar
                                            name={person.name}
                                            initials={person.initials}
                                            color={person.color}
                                            size="md"
                                            showPresence={!person.isGroup}
                                            online={person.online}
                                        />

                                        <span className="min-w-0 flex-1">
                                            <span
                                                className="block truncate text-[14px] font-medium"
                                                style={{
                                                    color: "var(--text)",
                                                }}
                                            >
                                                {person.name}
                                            </span>

                                            <span
                                                className="block truncate text-[12px]"
                                                style={{
                                                    color: "var(--text-muted)",
                                                }}
                                            >
                                                {person.role ||
                                                    (person.isGroup
                                                        ? `${person.members} members`
                                                        : person.online
                                                            ? "Active now"
                                                            : "Offline")}
                                            </span>
                                        </span>
                                    </button>

                                    {isFriend ? (
                                        <span
                                            className="
                                                flex
                                                shrink-0
                                                items-center
                                                gap-1.5
                                                rounded-full
                                                px-2.5
                                                py-1.5
                                                text-[11px]
                                                font-medium
                                            "
                                            style={{
                                                background:
                                                    "var(--accent-soft)",
                                                color: "var(--accent)",
                                            }}
                                        >
                                            <UserCheck size={13} />
                                            Friend
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSelectedPerson(person)
                                            }
                                            className="
                                                flex
                                                shrink-0
                                                items-center
                                                gap-1.5
                                                rounded-full
                                                px-3
                                                py-1.5
                                                text-[11px]
                                                font-semibold
                                                transition-transform
                                                active:scale-95
                                            "
                                            style={{
                                                background: requestSent
                                                    ? "var(--surface-hover)"
                                                    : "var(--accent-soft)",
                                                color: requestSent
                                                    ? "var(--text-muted)"
                                                    : "var(--accent)",
                                            }}
                                        >
                                            {requestSent ? (
                                                <>
                                                    <UserCheck size={13} />
                                                    Sent
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus size={13} />
                                                    Add
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Profile popup */}
            {selectedPerson && (
                <PersonPreview
                    person={selectedPerson}
                    isFriend={friendIds.has(selectedPerson.id)}
                    requestSent={sentRequests.has(selectedPerson.id)}
                    onClose={() => setSelectedPerson(null)}
                    onOpenChat={(id) => {
                        setSelectedPerson(null);
                        onOpenChat?.(id);
                    }}
                    onAddFriend={handleAddFriend}
                />
            )}
        </div>
    );
}