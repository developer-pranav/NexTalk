import { useEffect, useState } from "react";
import { Bell, ChevronRight, Pencil, ShieldCheck, Wallet } from "lucide-react";
import Avatar from "./Avatar";
import ThemeSwitch from "./ThemeSwitch";
import Toggle from "./Toggle";
import Toast from "./Toast";
import { currentUser, profileDashboard } from "../data/dummyData";

function SectionLabel({ children }) {
    return (
        <p className="mb-2 text-[12px] font-medium uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
            {children}
        </p>
    );
}

function DashboardRow({ icon: Icon, iconBg, iconColor, label, badge, badgeTone = "accent", onClick }) {
    const badgeStyle =
        badgeTone === "danger"
            ? { background: "var(--danger-soft)", color: "var(--danger)" }
            : { background: "var(--accent-soft)", color: "var(--accent)" };

    return (
        <button
            onClick={onClick}
            className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left transition-transform active:scale-[0.98]"
            style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}
        >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: iconBg, color: iconColor }}>
                <Icon size={18} />
            </div>
            <span className="flex-1 text-[14px] font-medium" style={{ color: "var(--text)" }}>
                {label}
            </span>
            {badge && (
                <span className="rounded-full px-2 py-1 text-[11px] font-semibold" style={badgeStyle}>
                    {badge}
                </span>
            )}
            <ChevronRight size={16} style={{ color: "var(--text-faint)" }} />
        </button>
    );
}

function PreferenceRow({ icon: Icon, label, checked, onChange }) {
    return (
        <div className="flex items-center gap-3 py-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
                <Icon size={16} />
            </div>
            <span className="flex-1 text-[13.5px]" style={{ color: "var(--text)" }}>
                {label}
            </span>
            <Toggle checked={checked} onChange={onChange} />
        </div>
    );
}

export default function ProfileScreen() {
    const [notifications, setNotifications] = useState(true);
    const [readReceipts, setReadReceipts] = useState(true);
    const [toastMsg, setToastMsg] = useState("");

    useEffect(() => {
        if (!toastMsg) return;
        const t = setTimeout(() => setToastMsg(""), 1600);
        return () => clearTimeout(t);
    }, [toastMsg]);

    const notify = (msg) => setToastMsg(msg);

    return (
        <div className="flex flex-col gap-6">
            {/* Identity */}
            <div
                className="flex flex-col items-center rounded-3xl px-5 py-6 text-center"
                style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}
            >
                <div className="relative">
                    <Avatar name={currentUser.name} initials={currentUser.initials} color={currentUser.color} size="2xl" />
                    <button
                        onClick={() => notify("Photo upload coming soon")}
                        className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full transition-transform active:scale-90"
                        style={{ background: "var(--accent)", color: "var(--accent-text)", border: "2px solid var(--surface)" }}
                        aria-label="Change photo"
                    >
                        <Pencil size={12} />
                    </button>
                </div>

                <div className="mt-3 flex items-center gap-1.5">
                    <p className="text-[17px] font-semibold" style={{ color: "var(--text)" }}>
                        {currentUser.name}
                    </p>
                    <button
                        onClick={() => notify("Editing profile coming soon")}
                        className="grid h-6 w-6 place-items-center rounded-full transition-transform active:scale-90"
                        style={{ color: "var(--text-faint)" }}
                        aria-label="Edit profile"
                    >
                        <Pencil size={13} />
                    </button>
                </div>
                <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                    {currentUser.role}
                </p>
            </div>

            <div>
                <SectionLabel>My Bio</SectionLabel>
                <div className="rounded-2xl px-4 py-3.5" style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}>
                    <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                        {currentUser.bio}
                    </p>
                </div>
            </div>

            {/* Dashboard */}
            {/* <div>
                <SectionLabel>Dashboard</SectionLabel>
                <div className="flex flex-col gap-2.5">
                    <DashboardRow
                        icon={Wallet}
                        iconBg="#1F9D6320"
                        iconColor="#1F9D63"
                        label="Payments"
                        badge={profileDashboard.paymentsNew ? `${profileDashboard.paymentsNew} New` : null}
                        onClick={() => notify("Payments coming soon")}
                    />
                    <DashboardRow
                        icon={Bell}
                        iconBg="#C0862B20"
                        iconColor="#C0862B"
                        label="Notifications"
                        badge={profileDashboard.notificationsNew ? `${profileDashboard.notificationsNew} New` : null}
                        onClick={() => notify("Notification center coming soon")}
                    />
                    <DashboardRow
                        icon={ShieldCheck}
                        iconBg={profileDashboard.privacyActionNeeded ? "var(--danger-soft)" : "var(--surface-2)"}
                        iconColor={profileDashboard.privacyActionNeeded ? "var(--danger)" : "var(--text-muted)"}
                        label="Privacy & Security"
                        badge={profileDashboard.privacyActionNeeded ? "Action needed" : null}
                        badgeTone="danger"
                        onClick={() => notify("Privacy settings coming soon")}
                    />
                </div>
            </div> */}

            {/* Settings: appearance */}
            <ThemeSwitch />

            {/* Settings: preferences */}
            {/* <div>
                <SectionLabel>Preferences</SectionLabel>
                <div style={{ borderTop: "1px solid var(--border)" }}>
                    <div style={{ borderBottom: "1px solid var(--border)" }}>
                        <PreferenceRow icon={Bell} label="Push notifications" checked={notifications} onChange={setNotifications} />
                    </div>
                    <div>
                        <PreferenceRow icon={ShieldCheck} label="Read receipts" checked={readReceipts} onChange={setReadReceipts} />
                    </div>
                </div>
            </div> */}

            {/* Account */}
            <div>
                <SectionLabel>My Account</SectionLabel>
                <div className="flex flex-col items-start gap-3">
                    <button
                        onClick={() => notify("Signed out (demo only)")}
                        className="text-[14px] font-medium"
                        style={{ color: "var(--danger)" }}
                    >
                        Log Out
                    </button>
                </div>
            </div>
            <div
                className="mt-6 border-t pt-4 text-center"
                style={{ borderColor: "var(--border)" }}
            >
                <p
                    className="text-[11px] font-medium tracking-wide"
                    style={{ color: "var(--text-faint)" }}
                >
                    Developed with ❤️ by Pranav
                </p>
            </div>

            <Toast message={toastMsg} />
        </div>
    );
}
