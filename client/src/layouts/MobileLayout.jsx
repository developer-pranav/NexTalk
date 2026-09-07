import { useEffect, useMemo, useRef, useState } from "react";
import ChatWindow from "../components/ChatWindow";
import HomeHeader from "../components/HomeHeader";
import ChatCard from "../components/ChatCard";
import ChatListOptionsMenu from "../components/ChatListOptionsMenu";
import MobileFloatingNav from "../components/MobileFloatingNav";
import ProfilePage from "../components/ProfilePage";
import NewGroupPage from "../components/NewGroupPage";
import Toast from "../components/Toast";
import SearchPage from "../components/SearchPage";
import RequestsPage from "../components/RequestsPage";
import { useChat } from "../context/ChatContext";
import { useRubberband } from "../hooks/useRubberband";

const CHAT_ANIMATION_MS = 280;

function currentPath() {
    return window.location.pathname || "/";
}

function chatIdFromPath(path) {
    const match = path.match(/^\/chat\/(.+)$/);
    return match ? decodeURIComponent(match[1]) : null;
}

export default function MobileLayout() {
    const { contacts, activeChatId, openChat, closeChat, messagesByChat, unreadCounts, typingChatId, clearChat, toggleBlock, unfriend } = useChat();
    const [query, setQuery] = useState("");
    const [toastMsg, setToastMsg] = useState("");
    const [contextMenu, setContextMenu] = useState(null);
    const [route, setRoute] = useState(currentPath);
    const [chatClosing, setChatClosing] = useState(false);
    const closeTimerRef = useRef(null);
    const scrollRef = useRef(null);
    const contentRef = useRef(null);

    useRubberband(scrollRef, contentRef);

    const activeContact = contacts.find((c) => c.id === activeChatId);
    const routeChatId = chatIdFromPath(route);
    const page = route === "/profile" ? "profile" : route === "/new-group" ? "new-group" : route === "/search" ? "search" : route === "/requests" ? "requests" : routeChatId ? "chat" : "home";

    const navigate = (path, replace = false) => {
        if (replace) window.history.replaceState({}, "", path);
        else window.history.pushState({}, "", path);
        setRoute(path);
    };

    const closeChatAnimated = () => {
        if (!activeContact || chatClosing) return;
        setChatClosing(true);
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = setTimeout(() => {
            closeChat();
            setChatClosing(false);
            navigate("/");
        }, CHAT_ANIMATION_MS);
    };

    useEffect(() => {
        const onPopState = () => setRoute(currentPath());
        window.addEventListener("popstate", onPopState);
        return () => window.removeEventListener("popstate", onPopState);
    }, []);

    // Direct URL / refresh support for /chat/:id.
    useEffect(() => {
        if (!routeChatId) return;
        const contact = contacts.find((c) => c.id === routeChatId);
        if (!contact) {
            navigate("/", true);
            return;
        }
        setChatClosing(false);
        if (activeChatId !== routeChatId) openChat(routeChatId);
    }, [routeChatId, contacts, activeChatId, openChat]);

    useEffect(() => {
        if (page === "chat" || !activeContact || chatClosing) return;
        setChatClosing(true);
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = setTimeout(() => {
            closeChat();
            setChatClosing(false);
        }, CHAT_ANIMATION_MS);
        return () => clearTimeout(closeTimerRef.current);
    }, [page, activeContact, chatClosing, closeChat]);

    useEffect(() => () => clearTimeout(closeTimerRef.current), []);

    useEffect(() => {
        if (!toastMsg) return;
        const t = setTimeout(() => setToastMsg(""), 1600);
        return () => clearTimeout(t);
    }, [toastMsg]);

    const openChatFromList = (id) => {
        setChatClosing(false);
        openChat(id);
        navigate(`/chat/${encodeURIComponent(id)}`);
    };

    const openChatContextMenu = (event, contact) => {
        event.preventDefault();
        setContextMenu({
            point: { x: event.clientX, y: event.clientY },
            contact,
        });
    };

    const openProfile = () => navigate("/profile");
    const openNewGroup = () => navigate("/new-group");
    const backToHome = () => navigate("/");
    const openSearch = () => { closeChat(); navigate("/search"); };
    const openRequests = () => { closeChat(); navigate("/requests"); };

    const unreadTotal = useMemo(() => Object.values(unreadCounts).reduce((a, b) => a + b, 0), [unreadCounts]);

    const filteredContacts = useMemo(() => {
        if (!query.trim()) return contacts;
        const q = query.toLowerCase();
        return contacts.filter((c) => c.name.toLowerCase().includes(q));
    }, [contacts, query]);

    if (page === "profile") {
        return <ProfilePage onBack={backToHome} />;
    }

    if (page === "new-group") {
        return <NewGroupPage onBack={backToHome} />;
    }

    if (page === "search") {
        return (
            <div className="relative h-full">
                <SearchPage onBack={backToHome} onOpenChat={openChatFromList} />
                <div className="absolute inset-x-0 bottom-0 z-20">
                    <MobileFloatingNav active="search" onChangeTab={(key) => key === "chats" ? backToHome() : key === "requests" ? openRequests() : openSearch()} onOpenProfile={openProfile} profileOpen={false} />
                </div>
            </div>
        );
    }

    if (page === "requests") {
        return (
            <div className="relative h-full">
                <RequestsPage onBack={backToHome} />
                <div className="absolute inset-x-0 bottom-0 z-20">
                    <MobileFloatingNav active="requests" onChangeTab={(key) => key === "chats" ? backToHome() : key === "search" ? openSearch() : openRequests()} onOpenProfile={openProfile} profileOpen={false} />
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex h-full w-full flex-col overflow-hidden" style={{ background: "var(--bg)" }}>
            {!activeContact && (
                <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden" style={{ background: "var(--bg)" }}>
                    <HomeHeader
                        unreadTotal={unreadTotal}
                        query={query}
                        onQueryChange={setQuery}
                        onNewChat={openNewGroup}
                    />

                    <div ref={scrollRef} className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 pb-32">
                        <div ref={contentRef}>
                            {filteredContacts.length === 0 ? (
                                <p className="pt-10 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
                                    No chats match “{query}”
                                </p>
                            ) : (
                                <div className="flex flex-col gap-2.5">
                                    {filteredContacts.map((c, i) => {
                                        const list = messagesByChat[c.id] || [];
                                        return (
                                            <ChatCard
                                                key={c.id}
                                                contact={c}
                                                unread={unreadCounts[c.id] || 0}
                                                isTyping={typingChatId === c.id}
                                                lastMessage={list[list.length - 1]}
                                                onSelect={openChatFromList}
                                                onContextMenu={openChatContextMenu}
                                                delay={i * 35}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20">
                        <div className="pointer-events-auto">
                            <MobileFloatingNav
                                active="chats"
                                onChangeTab={(key) => {
                                    if (key === "search") openSearch();
                                    if (key === "requests") openRequests();
                                }}
                                onOpenProfile={openProfile}
                                profileOpen={false}
                            />
                        </div>
                    </div>

                    {contextMenu && (
                        <ChatListOptionsMenu
                            point={contextMenu.point}
                            contact={contextMenu.contact}
                            onClose={() => setContextMenu(null)}
                            onClearChat={clearChat}
                            onToggleBlock={toggleBlock}
                            onUnfriend={unfriend}
                        />
                    )}

                    <Toast message={toastMsg} />
                </div>
            )}

            {activeContact && (
                <div
                    key={activeContact.id}
                    className={`absolute inset-0 z-50 ${chatClosing ? "anim-chat-slide-out-right" : "anim-chat-slide-in-right"}`}
                    style={{ background: "var(--bg)" }}
                >
                    <ChatWindow contact={activeContact} onBack={closeChatAnimated} />
                </div>
            )}
        </div>
    );
}
