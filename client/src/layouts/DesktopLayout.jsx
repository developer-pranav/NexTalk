import { useEffect, useState } from "react";
import IconRail from "../components/IconRail";
import ChatListPanel from "../components/ChatListPanel";
import ChatWindow, { EmptyChatState } from "../components/ChatWindow";
import ProfilePopup from "../components/ProfilePopup";
import ProfilePage from "../components/ProfilePage";
import NewGroupPopup from "../components/NewGroupPopup";
import Toast from "../components/Toast";
import SearchPage from "../components/SearchPage";
import RequestsPage from "../components/RequestsPage";
import { useChat } from "../context/ChatContext";
import { navigate, usePathname } from "../router/router";

export default function DesktopLayout() {
    const { contacts, activeChatId, openChat, closeChat } = useChat();
    const [profileOpen, setProfileOpen] = useState(false);
    const [newChatOpen, setNewChatOpen] = useState(false);
    const [toastMsg, setToastMsg] = useState("");
    const pathname = usePathname();
    const section = pathname === "/search" ? "search" : pathname === "/requests" ? "requests" : pathname === "/profile" ? "profile" : "chats";
    const routeChatId = pathname.startsWith("/chat/") ? decodeURIComponent(pathname.slice("/chat/".length)) : null;
    const activeContact = contacts.find((c) => String(c.id) === String(activeChatId));

    const openChatFromList = (id) => {
        openChat(id);
        navigate(`/chat/${encodeURIComponent(id)}`);
    };

    const backToHome = () => {
        closeChat();
        navigate("/");
    };

    useEffect(() => {
        // Keep desktop chat selection in sync with /chat/:id routes.
        if (routeChatId && String(routeChatId) !== String(activeChatId)) {
            const exists = contacts.some((c) => String(c.id) === String(routeChatId));
            if (exists) openChat(routeChatId);
        }
    }, [routeChatId, activeChatId, contacts, openChat]);

    useEffect(() => {
        if (!toastMsg) return;
        const t = setTimeout(() => setToastMsg(""), 1600);
        return () => clearTimeout(t);
    }, [toastMsg]);

    return (
        <div className="flex h-full w-full" style={{ background: "var(--bg)" }}>
            <IconRail active={section} onChangeTab={(key) => navigate(key === "search" ? "/search" : key === "requests" ? "/requests" : "/")} onOpenProfile={() => setProfileOpen(true)} />

            {section === "profile" ? (
                <div className="min-w-0 flex-1 py-3 pr-3">
                    <div className="h-full overflow-hidden rounded-3xl" style={{ background: "var(--surface)", boxShadow: "var(--shadow-md)", border: "1px solid var(--border)" }}>
                        <ProfilePage onBack={() => navigate("/")} />
                    </div>
                </div>
            ) : section === "chats" ? (
                <>
                    <div className="flex w-[360px] shrink-0 flex-col">
                        <ChatListPanel activeChatId={activeChatId} onSelect={openChatFromList} onNewChat={() => setNewChatOpen(true)} />
                    </div>
                    <div className="min-w-0 flex-1 py-3 pr-3">
                        <div className="h-full overflow-hidden rounded-3xl" style={{ background: "var(--surface)", boxShadow: "var(--shadow-md)", border: "1px solid var(--border)" }}>
                            {activeContact ? <ChatWindow contact={activeContact} onBack={backToHome} /> : <EmptyChatState />}
                        </div>
                    </div>
                </>
            ) : (
                <div className="min-w-0 flex-1 py-3 pr-3">
                    <div className="h-full overflow-hidden rounded-3xl" style={{ background: "var(--surface)", boxShadow: "var(--shadow-md)", border: "1px solid var(--border)" }}>
                        {section === "search" ? <SearchPage onOpenChat={openChatFromList} /> : <RequestsPage />}
                    </div>
                </div>
            )}

            <ProfilePopup
                open={profileOpen}
                onClose={() => setProfileOpen(false)}
                positionClassName="bottom-6 left-24 w-[380px] max-h-[75vh]"
                animationClassName="anim-popup-in"
            />
            <NewGroupPopup
                open={newChatOpen}
                onClose={() => setNewChatOpen(false)}
                positionClassName="top-20 left-24 w-[380px] max-h-[75vh]"
                animationClassName="anim-popup-in-tr"
            />
            <Toast message={toastMsg} />
        </div>
    );
}
