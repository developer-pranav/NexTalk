import { useEffect, useState } from "react";
import IconRail from "../components/IconRail";
import ChatListPanel from "../components/ChatListPanel";
import ChatWindow from "../components/ChatWindow";
import ProfilePopup from "../components/ProfilePopup";
import NewGroupPopup from "../components/NewGroupPopup";
import Toast from "../components/Toast";
import SearchPage from "../components/SearchPage";
import RequestsPage from "../components/RequestsPage";
import { useChat } from "../context/ChatContext";

export default function TabletLayout() {
  const { contacts, activeChatId, openChat, closeChat } = useChat();
  const [profileOpen, setProfileOpen] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [section, setSection] = useState("chats");
  const activeContact = contacts.find((c) => c.id === activeChatId);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(""), 1600);
    return () => clearTimeout(t);
  }, [toastMsg]);

  return (
    <div className="flex h-full w-full" style={{ background: "var(--bg)" }}>
      <IconRail active={section} onChangeTab={setSection} onOpenProfile={() => setProfileOpen(true)} />

      <div className="relative min-w-0 flex-1 overflow-hidden">
        {section === "chats" ? (
          <>
            <div className="absolute inset-0">
              <ChatListPanel activeChatId={activeChatId} onSelect={openChat} onNewChat={() => setNewChatOpen(true)} />
            </div>
            {activeContact && (
              <div key={activeContact.id} className="anim-slide-in-right absolute inset-0 p-3">
                <div className="h-full overflow-hidden rounded-3xl" style={{ background: "var(--surface)", boxShadow: "var(--shadow-md)", border: "1px solid var(--border)" }}>
                  <ChatWindow contact={activeContact} onBack={closeChat} />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-3 overflow-hidden rounded-3xl" style={{ background: "var(--surface)", boxShadow: "var(--shadow-md)", border: "1px solid var(--border)" }}>
            {section === "search" ? <SearchPage onOpenChat={(id) => { openChat(id); setSection("chats"); }} /> : <RequestsPage />}
          </div>
        )}
      </div>

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
