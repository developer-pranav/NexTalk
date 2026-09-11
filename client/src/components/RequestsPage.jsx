import { useEffect, useState } from "react";
import { ArrowLeft, Check, UserRound, X, UserPlus } from "lucide-react";
import Avatar from "./Avatar";
import { useToast } from "../context/ToastContext";
import { getFriendRequests, acceptFriendRequest, rejectFriendRequest } from "../api/friends.js";

function RequestProfilePopup({ request, onClose, onAccept, onDecline, busy }) {
    const sender = request.sender || request.user || request;
    const name = sender.fullname || sender.name || sender.username || "User";
    const username = sender.username || "";
    const bio = sender.bio || "No bio added yet.";
    const avatar = sender.avatar || null;
    const initials = name.split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase();

    return (
        <div className="fixed inset-0 z-[100]">
            <button type="button" aria-label="Close profile" onClick={onClose} className="absolute inset-0 cursor-default border-0 p-0" style={{ background: "rgba(0,0,0,.52)" }} />
            <div role="dialog" aria-modal="true" className="absolute left-1/2 top-1/2 w-[calc(100vw-32px)] max-w-[420px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[28px] anim-pop-in" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                    <div><p className="text-[15px] font-semibold" style={{ color: "var(--text)" }}>Profile</p><p className="mt-0.5 text-[12px]" style={{ color: "var(--text-muted)" }}>Friend request</p></div>
                    <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full" style={{ color: "var(--text-muted)" }}><X size={19} /></button>
                </div>
                <div className="px-5 py-5">
                    <div className="rounded-[24px] px-5 py-7 text-center" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                        <div className="flex flex-col items-center">
                            <Avatar name={name} initials={initials} src={avatar} size="2xl" />
                            <p className="mt-4 text-[19px] font-semibold tracking-tight" style={{ color: "var(--text)" }}>{name}</p>
                            {username && <p className="mt-1 text-[13px]" style={{ color: "var(--text-muted)" }}>@{username}</p>}
                        </div>
                    </div>
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
                            {bio}
                        </p>
                    </div>
                    <div className="mt-4 rounded-[18px] px-4 py-3" style={{ background: "var(--accent-soft)", border: "1px solid var(--border)" }}>
                        <p className="text-[12px] leading-5" style={{ color: "var(--text-muted)" }}>This person wants to connect with you.</p>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2.5">
                        <button type="button" disabled={busy} onClick={onDecline} className="flex items-center justify-center gap-2 rounded-[18px] px-4 py-3 text-[13px] font-semibold disabled:opacity-60" style={{ background: "var(--surface-hover)", color: "var(--text-muted)", border: "1px solid var(--border)" }}><X size={16} /> Decline</button>
                        <button type="button" disabled={busy} onClick={onAccept} className="flex items-center justify-center gap-2 rounded-[18px] px-4 py-3 text-[13px] font-semibold disabled:opacity-60" style={{ background: "var(--accent)", color: "#fff" }}><Check size={16} /> Accept</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function RequestsPage({ onBack }) {
    const { showToast } = useToast();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const response = await getFriendRequests();
            const data = response?.data ?? response;
            setRequests(Array.isArray(data) ? data : []);
        } catch (error) {
            setRequests([]);
            showToast(error?.response?.data?.message || "Could not load friend requests", { type: "error", title: "Requests" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadRequests(); }, []);

    const handleAction = async (request, action) => {
        const requestId = request._id || request.id;
        if (!requestId) return;
        try {
            setBusyId(requestId);
            if (action === "accept") await acceptFriendRequest(requestId);
            else await rejectFriendRequest(requestId);
            setRequests((prev) => prev.filter((item) => (item._id || item.id) !== requestId));
            setSelectedRequest(null);
            showToast(action === "accept" ? "Friend request accepted" : "Friend request declined", { type: "success" });
        } catch (error) {
            showToast(error?.response?.data?.message || `Could not ${action} request`, { type: "error", title: "Requests" });
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="relative flex h-full min-h-0 flex-col" style={{ background: "var(--bg)" }}>
            <div className="shrink-0 px-4 pb-4 pt-5">
                <div className="flex items-center gap-3">
                    {onBack && <button type="button" onClick={onBack} className="grid h-10 w-10 place-items-center rounded-full" style={{ background: "var(--surface)", color: "var(--text)", boxShadow: "var(--shadow-sm)" }}><ArrowLeft size={18} /></button>}
                    <div><h1 className="text-[25px] font-semibold tracking-tight" style={{ color: "var(--text)" }}>Requests</h1><p className="text-[13px]" style={{ color: "var(--text-muted)" }}>{loading ? "Loading requests…" : requests.length ? `${requests.length} pending request${requests.length > 1 ? "s" : ""}` : "You're all caught up"}</p></div>
                </div>
            </div>

            <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 pb-32">
                {loading ? (
                    <div className="flex h-full items-center justify-center text-[13px]" style={{ color: "var(--text-muted)" }}>Loading requests…</div>
                ) : requests.length ? (
                    <div className="flex flex-col gap-2.5">
                        {requests.map((request) => {
                            const sender = request.sender || request.user || request;
                            const name = sender.fullname || sender.name || sender.username || "User";
                            const initials = name.split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase();
                            const requestId = request._id || request.id;
                            return (
                                <div key={requestId} className="flex cursor-pointer items-center gap-3 rounded-2xl p-3" onClick={() => setSelectedRequest(request)} style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                    <Avatar name={name} initials={initials} src={sender.avatar || null} size="md" />
                                    <div className="min-w-0 flex-1"><p className="truncate text-[14px] font-medium" style={{ color: "var(--text)" }}>{name}</p><p className="mt-0.5 truncate text-[12px]" style={{ color: "var(--text-muted)" }}>Wants to connect with you</p></div>
                                    <div className="flex shrink-0 gap-1.5" onClick={(e) => e.stopPropagation()}>
                                        <button type="button" disabled={busyId === requestId} onClick={() => handleAction(request, "accept")} className="grid h-9 w-9 place-items-center rounded-full disabled:opacity-50" style={{ background: "var(--accent-soft)", color: "var(--accent)" }} aria-label="Accept"><Check size={17} /></button>
                                        <button type="button" disabled={busyId === requestId} onClick={() => handleAction(request, "reject")} className="grid h-9 w-9 place-items-center rounded-full disabled:opacity-50" style={{ background: "var(--surface-2)", color: "var(--text-muted)" }} aria-label="Decline"><X size={17} /></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex h-full flex-col items-center justify-center px-8 text-center"><div className="grid h-14 w-14 place-items-center rounded-full" style={{ background: "var(--surface)", color: "var(--text-muted)", border: "1px solid var(--border)" }}><UserRound size={23} /></div><p className="mt-3 text-[14px] font-medium" style={{ color: "var(--text)" }}>No pending requests</p></div>
                )}
            </div>

            {selectedRequest && <RequestProfilePopup request={selectedRequest} busy={busyId === (selectedRequest._id || selectedRequest.id)} onClose={() => setSelectedRequest(null)} onAccept={() => handleAction(selectedRequest, "accept")} onDecline={() => handleAction(selectedRequest, "reject")} />}
        </div>
    );
}
