import { useEffect, useState } from "react";
import { X } from "lucide-react";
import ProfileScreen from "./ProfileScreen";

const ANIMATION_MS = 300;

export default function ProfilePopup({
    open,
    onClose,
    positionClassName = "",
    origin = null,
}) {
    const [mounted, setMounted] = useState(open);
    const [closing, setClosing] = useState(false);

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

    const style = origin
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
                onClick={onClose}
            />

            {/* Center container */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-0 md:p-4">
                <div
                    className={`pointer-events-auto flex flex-col overflow-hidden ${closing ? "anim-modal-out" : "anim-modal-in"
                        } ${positionClassName}`}
                    style={{
                        ...style,
                        background: "var(--surface)",
                        boxShadow: "var(--shadow-lg)",
                        border: "1px solid var(--border)",
                    }}
                >
                    <div
                        className="flex shrink-0 items-center justify-between px-5 py-4"
                        style={{
                            borderBottom: "1px solid var(--border)",
                        }}
                    >
                        <p
                            className="text-[15px] font-semibold"
                            style={{ color: "var(--text)" }}
                        >
                            My Profile
                        </p>

                        <button
                            onClick={onClose}
                            className="grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-[var(--surface-hover)]"
                            style={{ color: "var(--text-muted)" }}
                            aria-label="Close profile"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="scroll-thin flex-1 overflow-y-auto px-5 py-5">
                        <ProfileScreen />
                    </div>
                </div>
            </div>
        </div>
    );
}