import { Bell, MessageSquare, Search } from "lucide-react";
import Avatar from "./Avatar";
import { currentUser } from "../data/dummyData";

export default function IconRail({ active = "chats", onChangeTab, onOpenProfile }) {
  const items = [
    { key: "chats", label: "Chats", icon: MessageSquare },
    { key: "search", label: "Search", icon: Search },
    { key: "requests", label: "Requests", icon: Bell },
  ];

  return (
    <div className="flex h-full w-20 shrink-0 flex-col items-center justify-between py-5">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl text-[15px] font-semibold" style={{ background: "var(--accent)", color: "var(--accent-text)", boxShadow: "var(--shadow-sm)" }}>C</div>
      <div className="flex flex-col items-center gap-2 rounded-full px-2 py-3" style={{ background: "var(--surface)", boxShadow: "var(--shadow-md)", border: "1px solid var(--border)" }}>
        {items.map(({ key, label, icon: Icon }) => {
          const isActive = active === key;
          return (
            <button key={key} onClick={() => onChangeTab?.(key)} className="grid h-10 w-10 place-items-center rounded-full transition-all duration-150 active:scale-90" style={{ background: isActive ? "var(--accent-soft)" : "transparent", color: isActive ? "var(--accent)" : "var(--text-faint)" }} aria-label={label}>
              <Icon size={18} strokeWidth={isActive ? 2.3 : 2} />
            </button>
          );
        })}
        <div className="my-1 h-px w-6" style={{ background: "var(--border)" }} />
        <button onClick={onOpenProfile} className="rounded-full transition-transform active:scale-90" aria-label="Open profile">
          <Avatar name={currentUser.name} initials={currentUser.initials} color={currentUser.color} size="sm" />
        </button>
      </div>
    </div>
  );
}
