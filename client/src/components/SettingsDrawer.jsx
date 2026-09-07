import { X } from "lucide-react";
import SettingsBody from "./SettingsBody";

export default function SettingsDrawer({ open, onClose }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 anim-fade-in" style={{ background: "rgba(0,0,0,0.32)" }} onClick={onClose} />
            <div
                className="anim-slide-in-right relative flex h-full w-full max-w-[380px] flex-col"
                style={{ background: "var(--surface)", boxShadow: "var(--shadow-lg)" }}
            >
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                    <p className="text-[15px] font-medium" style={{ color: "var(--text)" }}>
                        Settings
                    </p>
                    <button
                        onClick={onClose}
                        className="grid h-8 w-8 place-items-center rounded-full hover:bg-[var(--surface-hover)] transition-colors"
                        style={{ color: "var(--text-muted)" }}
                        aria-label="Close settings"
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="scroll-thin flex-1 overflow-y-auto px-5 py-5">
                    <SettingsBody />
                </div>
            </div>
        </div>
    );
}
