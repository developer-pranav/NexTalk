import { Search } from "lucide-react";

export default function HomeHeader({
    unreadTotal,
    query,
    onQueryChange,
    onNewChat,
}) {
    return (
        <div className="px-4 pt-5 pb-3">
            <div className="flex items-start justify-between">
                <div>
                    <h1
                        className="text-[26px] font-semibold tracking-tight"
                        style={{ color: "var(--text)" }}
                    >
                        Chats
                    </h1>

                    <p
                        className="mt-0.5 text-[13px]"
                        style={{ color: "var(--text-muted)" }}
                    >
                        {unreadTotal > 0
                            ? `${unreadTotal} unread message${
                                  unreadTotal > 1 ? "s" : ""
                              }`
                            : "You're all caught up"}
                    </p>
                </div>
            </div>

            <div className="anim-pop-in mt-3">
                <div
                    className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5"
                    style={{
                        background: "var(--surface)",
                        boxShadow: "var(--shadow-sm)",
                    }}
                >
                    <Search
                        size={16}
                        style={{
                            color: "var(--text-faint)",
                        }}
                    />

                    <input
                        value={query}
                        onChange={(e) =>
                            onQueryChange(e.target.value)
                        }
                        placeholder="Search chats"
                        className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[var(--text-faint)]"
                        style={{
                            color: "var(--text)",
                        }}
                    />

                    {query && (
                        <button
                            type="button"
                            onClick={() => onQueryChange("")}
                            className="text-[12px] font-medium"
                            style={{
                                color: "var(--accent)",
                            }}
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}