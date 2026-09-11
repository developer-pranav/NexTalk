import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

const config = {
    error: { Icon: AlertCircle, accent: "var(--danger)", soft: "var(--danger-soft)", title: "Something went wrong" },
    success: { Icon: CheckCircle2, accent: "var(--online)", soft: "rgba(31, 157, 99, 0.12)", title: "Success" },
    info: { Icon: Info, accent: "var(--accent)", soft: "var(--accent-soft)", title: "Heads up" },
    default: { Icon: Info, accent: "var(--accent)", soft: "var(--accent-soft)", title: "Heads up" },
};

export default function Toast({ toast, onClose, message, position = "bottom-center", type = "default" }) {
    // Backward compatibility for existing chat/layout notifications.
    if (!toast && message) {
        const legacy = config[type] || config.default;
        const LegacyIcon = legacy.Icon;
        const positionClass = position === "top-right" ? "right-4 top-4 sm:right-5 sm:top-5" : "bottom-24 left-1/2 -translate-x-1/2";

        return (
            <div className={`pointer-events-none fixed z-[200] ${positionClass}`}>
                <div
                    className="anim-pop-in flex max-w-[calc(100vw-32px)] items-center gap-2 rounded-xl border px-3.5 py-2.5 text-[13px] font-medium"
                    style={{ background: "var(--surface)", color: "var(--text)", borderColor: "var(--border)", boxShadow: "var(--shadow-lg)" }}
                >
                    <LegacyIcon size={16} style={{ color: legacy.accent }} />
                    <span>{message}</span>
                </div>
            </div>
        );
    }

    if (!toast) return null;

    const item = config[toast.type] || config.info;
    const Icon = item.Icon;

    return (
        <div className="fixed right-4 top-4 z-[200] w-[calc(100vw-32px)] max-w-[390px] pointer-events-none sm:right-5 sm:top-5">
            <div key={toast.id} className="pointer-events-auto overflow-hidden rounded-2xl border anim-pop-in" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-lg)" }}>
                <div className="flex items-start gap-3 px-4 py-3.5">
                    <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ background: item.soft, color: item.accent }}>
                        <Icon size={18} strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0 flex-1 pr-1">
                        <p className="text-[13px] font-semibold" style={{ color: "var(--text)" }}>{toast.title || item.title}</p>
                        <p className="mt-0.5 text-[12.5px] leading-5" style={{ color: "var(--text-muted)" }}>{toast.message}</p>
                    </div>
                    <button type="button" onClick={onClose} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg hover:bg-[var(--surface-hover)]" style={{ color: "var(--text-faint)" }} aria-label="Close notification">
                        <X size={15} />
                    </button>
                </div>
                <div className="h-[2px] origin-left" style={{ background: item.accent, animation: toast.duration > 0 ? `toast-progress ${toast.duration}ms linear forwards` : "none" }} />
            </div>
        </div>
    );
}
