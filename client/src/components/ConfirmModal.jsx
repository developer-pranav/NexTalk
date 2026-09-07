import { AlertTriangle, X } from "lucide-react";

export default function ConfirmModal({ open, title, message, confirmLabel = "Confirm", danger = true, onConfirm, onClose }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/45 px-4" onMouseDown={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                className="w-full max-w-sm rounded-2xl border p-5 shadow-[var(--shadow-lg)]"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: danger ? "color-mix(in srgb, var(--danger) 10%, transparent)" : "var(--accent-soft)", color: danger ? "var(--danger)" : "var(--accent)" }}>
                        <AlertTriangle size={19} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-[15px] font-semibold" style={{ color: "var(--text)" }}>{title}</h3>
                        <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{message}</p>
                    </div>
                    <button type="button" onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full" style={{ color: "var(--text-muted)" }} aria-label="Close">
                        <X size={16} />
                    </button>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="rounded-xl px-3.5 py-2 text-[13px] font-medium" style={{ color: "var(--text-muted)", background: "var(--surface-2)" }}>
                        Cancel
                    </button>
                    <button type="button" onClick={() => { onConfirm?.(); onClose?.(); }} className="rounded-xl px-3.5 py-2 text-[13px] font-semibold" style={{ background: danger ? "var(--danger)" : "var(--accent)", color: danger ? "white" : "var(--accent-text)" }}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
