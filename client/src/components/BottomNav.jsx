import { MessageSquare, Settings } from "lucide-react";

export default function BottomNav({ active, onChange }) {
    const items = [
        { key: "chats", label: "Chats", icon: MessageSquare },
        { key: "settings", label: "Settings", icon: Settings },
    ];

    return (
        <div
            className="flex shrink-0 items-center justify-around px-2 pt-1.5"
            style={{
                background: "var(--surface)",
                borderTop: "1px solid var(--border)",
                paddingBottom: "max(6px, env(safe-area-inset-bottom))",
            }}
        >
            {items.map(({ key, label, icon: Icon }) => {
                const isActive = active === key;
                return (
                    <button
                        key={key}
                        onClick={() => onChange(key)}
                        className="flex flex-1 flex-col items-center gap-0.5 py-1.5 transition-transform active:scale-95"
                        style={{ color: isActive ? "var(--accent)" : "var(--text-faint)" }}
                    >
                        <Icon size={21} strokeWidth={isActive ? 2.3 : 2} />
                        <span className="text-[10.5px] font-medium">{label}</span>
                    </button>
                );
            })}
        </div>
    );
}
