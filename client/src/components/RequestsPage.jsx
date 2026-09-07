import { useState } from "react";
import { ArrowLeft, Check, UserRound, X } from "lucide-react";
import Avatar from "./Avatar";

const initialRequests = [
    { id: "r1", name: "Aarav Mehta", initials: "AM", color: "#7A4FD1", note: "Wants to connect with you" },
    { id: "r2", name: "Nisha Shah", initials: "NS", color: "#2E8FA6", note: "Sent you a message request" },
    { id: "r3", name: "Vikram Joshi", initials: "VJ", color: "#C13F63", note: "Wants to connect with you" },
];

export default function RequestsPage({ onBack }) {
    const [requests, setRequests] = useState(initialRequests);
    const [toast, setToast] = useState("");

    const act = (id, message) => {
        setRequests((prev) => prev.filter((r) => r.id !== id));
        setToast(message);
        setTimeout(() => setToast(""), 1300);
    };

    return (
        <div className="relative flex h-full min-h-0 flex-col" style={{ background: "var(--bg)" }}>
            <div className="shrink-0 px-4 pb-4 pt-5">
                <div className="flex items-center gap-3">
                    {onBack && <button type="button" onClick={onBack} className="grid h-10 w-10 place-items-center rounded-full" style={{ background: "var(--surface)", color: "var(--text)", boxShadow: "var(--shadow-sm)" }}><ArrowLeft size={18} /></button>}
                    <div>
                        <h1 className="text-[25px] font-semibold tracking-tight" style={{ color: "var(--text)" }}>Requests</h1>
                        <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>{requests.length ? `${requests.length} pending request${requests.length > 1 ? "s" : ""}` : "You're all caught up"}</p>
                    </div>
                </div>
            </div>

            <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 pb-32">
                {requests.length ? (
                    <div className="flex flex-col gap-2.5">
                        {requests.map((request) => (
                            <div key={request.id} className="flex items-center gap-3 rounded-2xl p-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                <Avatar name={request.name} initials={request.initials} color={request.color} size="md" />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-[14px] font-medium" style={{ color: "var(--text)" }}>{request.name}</p>
                                    <p className="mt-0.5 truncate text-[12px]" style={{ color: "var(--text-muted)" }}>{request.note}</p>
                                </div>
                                <div className="flex shrink-0 gap-1.5">
                                    <button type="button" onClick={() => act(request.id, "Request accepted")} className="grid h-9 w-9 place-items-center rounded-full" style={{ background: "var(--accent-soft)", color: "var(--accent)" }} aria-label="Accept"><Check size={17} /></button>
                                    <button type="button" onClick={() => act(request.id, "Request declined")} className="grid h-9 w-9 place-items-center rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-muted)" }} aria-label="Decline"><X size={17} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                        <div className="grid h-14 w-14 place-items-center rounded-full" style={{ background: "var(--surface)", color: "var(--text-muted)", border: "1px solid var(--border)" }}><UserRound size={23} /></div>
                        <p className="mt-3 text-[14px] font-medium" style={{ color: "var(--text)" }}>No pending requests</p>
                    </div>
                )}
            </div>

            {toast && <div className="anim-pop-in absolute bottom-5 left-1/2 z-30 -translate-x-1/2 rounded-full px-4 py-2 text-[12px]" style={{ background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>{toast}</div>}
        </div>
    );
}
