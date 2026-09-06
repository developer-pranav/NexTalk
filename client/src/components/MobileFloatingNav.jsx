import { Bell, MessageSquare, Search } from "lucide-react";
import Avatar from "./Avatar";
import { currentUser } from "../data/dummyData";

export default function MobileFloatingNav({ active, onChangeTab, onOpenProfile, profileOpen }) {
    const items = [
        { key: "chats", label: "Chats", icon: MessageSquare },
        { key: "search", label: "Search", icon: Search },
        { key: "requests", label: "Requests", icon: Bell },
    ];

    return (
        <div className="relative w-full px-4 pb-4 pt-1">
            <div
                className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-32"
                style={{ background: `linear-gradient(to bottom, rgba(var(--bg-rgb),0) 0%, rgba(var(--bg-rgb),0.18) 24%, rgba(var(--bg-rgb),0.45) 48%, rgba(var(--bg-rgb),0.78) 72%, rgba(var(--bg-rgb),1) 100%)` }}
            />
            <div className="relative z-10 flex items-center justify-between rounded-full px-3 py-2" style={{ background: "var(--surface)", boxShadow: "var(--shadow-lg)", border: "1px solid var(--border)" }}>
                {items.map(({ key, label, icon: Icon }) => {
                    const isActive = active === key;
                    return (
                        <button key={key} type="button" onClick={() => onChangeTab?.(key)} className="grid h-10 w-10 place-items-center rounded-full transition-all duration-150 active:scale-90" style={{ background: isActive ? "var(--accent-soft)" : "transparent", color: isActive ? "var(--accent)" : "var(--text-faint)" }} aria-label={label}>
                            <Icon size={19} strokeWidth={isActive ? 2.3 : 2} />
                        </button>
                    );
                })}
                <button type="button" onClick={onOpenProfile} className="grid place-items-center rounded-full transition-all duration-150 active:scale-90" style={{ padding: profileOpen ? 2 : 0, border: profileOpen ? "2px solid var(--accent)" : "2px solid transparent" }} aria-label="Open profile">
                    <Avatar name={currentUser.name} initials={currentUser.initials} color={currentUser.color} size="sm" />
                </button>
            </div>
        </div>
    );
}
