import { useState } from "react";
import { Bell, CircleUserRound, Lock, LogOut, ShieldBan, X } from "lucide-react";
import Avatar from "./Avatar";
import ThemeSwitch from "./ThemeSwitch";
import { currentUser } from "../data/dummyData";
import { useAuth } from "../context/AuthContext";
import { getBlockedUsers, unblockUser } from "../api/friends.js";
import BlocklistModal from "./BlocklistModal";

function Toggle({ checked, onChange }) {
    return (
        <button
            onClick={() => onChange(!checked)}
            className="relative h-6 w-10 shrink-0 rounded-full transition-colors duration-200"
            style={{ background: checked ? "var(--accent)" : "var(--surface-hover)" }}
            aria-pressed={checked}
        >
            <span
                className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200"
                style={{ transform: checked ? "translateX(18px)" : "translateX(2px)" }}
            />
        </button>
    );
}

function Row({ icon: Icon, label, right }) {
    return (
        <div className="flex items-center gap-3 py-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
                <Icon size={16} />
            </div>
            <span className="flex-1 text-[13.5px]" style={{ color: "var(--text)" }}>
                {label}
            </span>
            {right}
        </div>
    );
}

export default function SettingsBody() {
    const { logout } = useAuth();
    const [notifications, setNotifications] = useState(true);
    const [readReceipts, setReadReceipts] = useState(true);
    const [blocklistOpen, setBlocklistOpen] = useState(false);
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [blockedLoading, setBlockedLoading] = useState(false);
    const [unblockingId, setUnblockingId] = useState(null);

    const readBlockedUsers = (response) => {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response?.data)) return response.data;
        if (Array.isArray(response?.data?.data)) return response.data.data;
        return [];
    };

    const openBlocklist = async () => {
        setBlocklistOpen(true);
        setBlockedLoading(true);
        try {
            const response = await getBlockedUsers();
            setBlockedUsers(readBlockedUsers(response));
        } catch (error) {
            console.error("Failed to load blocklist:", error);
            setBlockedUsers([]);
        } finally {
            setBlockedLoading(false);
        }
    };

    const handleUnblock = async (userId) => {
        setUnblockingId(userId);
        try {
            await unblockUser(userId);
            setBlockedUsers((previous) => previous.filter((item) => String(item._id || item.id) !== String(userId)));
        } catch (error) {
            console.error("Unblock failed:", error);
        } finally {
            setUnblockingId(null);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <Avatar name={currentUser.name} initials={currentUser.initials} color={currentUser.color} size="lg" />
                <div>
                    <p className="text-[15px] font-medium" style={{ color: "var(--text)" }}>
                        {currentUser.name}
                    </p>
                    <p className="text-[12.5px]" style={{ color: "var(--text-muted)" }}>
                        you@example.com
                    </p>
                </div>
            </div>

            <ThemeSwitch />

            <div>
                <p className="mb-1 text-[13px] font-medium" style={{ color: "var(--text)" }}>
                    Preferences
                </p>
                <div style={{ borderTop: "1px solid var(--border)" }}>
                    <div style={{ borderBottom: "1px solid var(--border)" }}>
                        <Row icon={Bell} label="Notifications" right={<Toggle checked={notifications} onChange={setNotifications} />} />
                    </div>
                    <div style={{ borderBottom: "1px solid var(--border)" }}>
                        <Row icon={CircleUserRound} label="Read receipts" right={<Toggle checked={readReceipts} onChange={setReadReceipts} />} />
                    </div>
                    <div style={{ borderBottom: "1px solid var(--border)" }}>
                        <Row icon={Lock} label="Privacy" right={<span className="text-[12px]" style={{ color: "var(--text-faint)" }}>Standard</span>} />
                    </div>
                    <button type="button" onClick={openBlocklist} className="w-full text-left" style={{ borderBottom: "1px solid var(--border)" }}>
                        <Row icon={ShieldBan} label="Blocklist" right={<span className="text-[12px]" style={{ color: "var(--text-faint)" }}>{blockedUsers.length} blocked</span>} />
                    </button>
                </div>
            </div>

            <BlocklistModal
                open={blocklistOpen}
                users={blockedUsers}
                loading={blockedLoading}
                unblockingId={unblockingId}
                onClose={() => setBlocklistOpen(false)}
                onUnblock={handleUnblock}
            />

            <button
                onClick={async () => { try { await logout(); } catch {} }}
                className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13.5px] font-medium transition-colors"
                style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
            >
                <LogOut size={16} />
                Sign out
            </button>
        </div>
    );
}
