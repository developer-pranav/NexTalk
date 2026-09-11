import { useEffect, useMemo, useState } from "react";
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
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { searchUsers } from "../api/users.js";
import {
    sendFriendRequest,
    getMyConnections,
    cancelFriendRequest,
} from "../api/friends.js";


function PersonPreview({
    person,
    isFriend,
    onClose,
    onOpenChat,
    onAddFriend,
    onCancelRequest,
    requestSent,
    requestId,
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

                        <div className="relative flex flex-col items-center">
                            <Avatar
                                name={person.name}
                                initials={person.initials}
                                color={person.color}
                                size="2xl"
                                showPresence={isFriend}
                                online={isFriend && person.online}
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
                                @{person.username}
                            </p>
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
                                onClick={() =>
                                    requestSent
                                        ? onCancelRequest(requestId)
                                        : onAddFriend(person.id)
                                }
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
                                        Cancel request
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
    const { user } = useAuth();
    const { showToast } = useToast();

    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchError, setSearchError] = useState("");
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [connections, setConnections] = useState([]);
    const [actionId, setActionId] = useState(null);

    const loadConnections = async () => {
        try {
            const response = await getMyConnections();
            setConnections(response?.data || []);
        } catch (error) {
            console.error("Failed to load connections:", error);
        }
    };

    useEffect(() => {
        loadConnections();
    }, []);

    useEffect(() => {
        const trimmedQuery = query.trim();

        if (trimmedQuery.length < 2) {
            setResults([]);
            setLoading(false);
            setSearchError("");
            return;
        }

        let cancelled = false;

        const timer = setTimeout(async () => {
            try {
                setLoading(true);
                setSearchError("");

                const response = await searchUsers(trimmedQuery);
                if (cancelled) return;

                const users = response?.data || [];
                setResults(
                    users
                        .filter((item) => item._id !== user?._id)
                        .map((item) => ({
                            id: item._id,
                            name: item.fullname,
                            username: item.username,
                            avatar: item.avatar,
                            initials: item.fullname
                                ?.split(" ")
                                .map((part) => part[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase(),
                            color: "var(--accent)",
                            online: false,
                            isGroup: false,
                        }))
                );
            } catch (error) {
                if (cancelled) return;
                console.error("User search failed:", error);
                setResults([]);
                setSearchError(
                    error?.response?.data?.message ||
                        "Unable to search users right now."
                );
            } finally {
                if (!cancelled) setLoading(false);
            }
        }, 500);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [query, user?._id]);

    const connectionMap = useMemo(() => {
        const map = new Map();

        connections.forEach((connection) => {
            const senderId = connection.sender?._id || connection.sender;
            const receiverId = connection.receiver?._id || connection.receiver;
            const otherId = String(senderId) === String(user?._id)
                ? receiverId
                : senderId;

            map.set(String(otherId), connection);
        });

        return map;
    }, [connections, user?._id]);

    const getConnectionState = (personId) => {
        const connection = connectionMap.get(String(personId));

        if (!connection) return { status: "none", requestId: null };

        if (connection.status === "friend") {
            return { status: "friend", requestId: connection._id };
        }

        if (connection.status === "pending") {
            const senderId = connection.sender?._id || connection.sender;
            const isSentByMe = String(senderId) === String(user?._id);

            return {
                status: isSentByMe ? "pending_sent" : "pending_received",
                requestId: connection._id,
            };
        }

        return { status: connection.status, requestId: connection._id };
    };

    const handleAddFriend = async (id) => {
        try {
            setActionId(id);
            const response = await sendFriendRequest(id);
            const newConnection = response?.data;

            if (newConnection) {
                setConnections((previous) => [
                    ...previous.filter((item) => item._id !== newConnection._id),
                    newConnection,
                ]);
            } else {
                await loadConnections();
            }

            showToast("Your friend request has been sent.", {
                title: "Request sent",
                type: "success",
            });
        } catch (error) {
            console.error("Friend request failed:", error);
            showToast(
                error?.response?.data?.message ||
                    "We couldn't send the friend request. Please try again.",
                { title: "Request failed", type: "error" }
            );
        } finally {
            setActionId(null);
        }
    };

    const handleCancelRequest = async (requestId, personId) => {
        if (!requestId) return;

        try {
            setActionId(personId);
            await cancelFriendRequest(requestId);
            setConnections((previous) =>
                previous.filter((item) => item._id !== requestId)
            );

            showToast("The friend request has been cancelled.", {
                title: "Request cancelled",
                type: "info",
            });
        } catch (error) {
            console.error("Cancel request failed:", error);
            showToast(
                error?.response?.data?.message ||
                    "We couldn't cancel the request. Please try again.",
                { title: "Couldn't cancel request", type: "error" }
            );
        } finally {
            setActionId(null);
        }
    };

    const friendIds = useMemo(
        () => new Set(
            connections
                .filter((connection) => connection.status === "friend")
                .map((connection) => {
                    const senderId = connection.sender?._id || connection.sender;
                    const receiverId = connection.receiver?._id || connection.receiver;
                    return String(senderId) === String(user?._id)
                        ? String(receiverId)
                        : String(senderId);
                })
        ),
        [connections, user?._id]
    );

    const openPerson = (person) => {
        if (friendIds.has(String(person.id))) {
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
                {loading ? (
                    <div className="pt-12 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
                        Searching...
                    </div>
                ) : searchError ? (
                    <div className="pt-12 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
                        {searchError}
                    </div>
                ) : query.trim().length > 0 && query.trim().length < 2 ? (
                    <div className="pt-12 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
                        Type at least 2 characters to search.
                    </div>
                ) : !query.trim() ? (
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
                            const connectionState = getConnectionState(person.id);
                            const isFriend = connectionState.status === "friend";
                            const requestSent = connectionState.status === "pending_sent";
                            const requestReceived = connectionState.status === "pending_received";

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
                                            showPresence={isFriend}
                                            online={isFriend && person.online}
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
                                                @{person.username}
                                            </span>
                                        </span>
                                    </button>

                                    {isFriend ? (
                                        <span
                                            className="flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-medium"
                                            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                                        >
                                            <UserCheck size={13} />
                                            Friend
                                        </span>
                                    ) : requestSent ? (
                                        <button
                                            type="button"
                                            disabled={actionId === person.id}
                                            onClick={() => handleCancelRequest(connectionState.requestId, person.id)}
                                            className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold disabled:opacity-50"
                                            style={{ background: "var(--surface-hover)", color: "var(--text-muted)" }}
                                        >
                                            <X size={13} />
                                            Cancel
                                        </button>
                                    ) : requestReceived ? (
                                        <span
                                            className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold"
                                            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                                        >
                                            <UserCheck size={13} />
                                            Pending
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            disabled={actionId === person.id}
                                            onClick={() => handleAddFriend(person.id)}
                                            className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold disabled:opacity-50"
                                            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                                        >
                                            <UserPlus size={13} />
                                            Add
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
                    isFriend={friendIds.has(String(selectedPerson.id))}
                    requestSent={getConnectionState(selectedPerson.id).status === "pending_sent"}
                    requestId={getConnectionState(selectedPerson.id).requestId}
                    onClose={() => setSelectedPerson(null)}
                    onOpenChat={(id) => {
                        setSelectedPerson(null);
                        onOpenChat?.(id);
                    }}
                    onAddFriend={handleAddFriend}
                    onCancelRequest={(requestId) => {
                        handleCancelRequest(requestId, selectedPerson.id);
                        setSelectedPerson(null);
                    }}
                />
            )}
        </div>
    );
}