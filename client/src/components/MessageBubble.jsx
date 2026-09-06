import { useRef } from "react";
import { Check, CheckCheck } from "lucide-react";

const LONG_PRESS_MS = 450;
const LONG_PRESS_MOVE_TOLERANCE = 10;

function StatusIcon({ status }) {
  if (status === "read") return <CheckCheck size={14} strokeWidth={2.2} />;
  if (status === "delivered") return <CheckCheck size={14} strokeWidth={2.2} style={{ opacity: 0.7 }} />;
  return <Check size={14} strokeWidth={2.2} style={{ opacity: 0.7 }} />;
}

export default function MessageBubble({ message, showAuthor, animate, onMenu, onReplyNavigate, searchActive = false, selected = false, selectMode = false, onToggleSelect }) {
  const isMe = message.from === "me";
  const pressTimerRef = useRef(null);
  const pressStartRef = useRef({ x: 0, y: 0 });
  const longPressFiredRef = useRef(false);

  const openMenu = (x, y) => onMenu?.(message, x, y);

  const handleClick = () => {
    if (selectMode && !message.deleted) onToggleSelect?.(message.id);
  };

  const handleReplyClick = (e) => {
    e.stopPropagation();
    if (message.replyTo?.id) onReplyNavigate?.(message.replyTo.id);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    openMenu(e.clientX, e.clientY);
  };

  const clearPressTimer = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    pressStartRef.current = { x: touch.clientX, y: touch.clientY };
    longPressFiredRef.current = false;
    clearPressTimer();
    pressTimerRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      openMenu(touch.clientX, touch.clientY);
    }, LONG_PRESS_MS);
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    const dx = touch.clientX - pressStartRef.current.x;
    const dy = touch.clientY - pressStartRef.current.y;
    if (Math.hypot(dx, dy) > LONG_PRESS_MOVE_TOLERANCE) clearPressTimer();
  };

  const handleTouchEnd = () => clearPressTimer();

  return (
    <div
      className={`flex ${isMe ? "justify-end" : "justify-start"} ${animate ? "anim-bubble-in" : ""}`}
    >
      <div
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className={`max-w-[78%] sm:max-w-[65%] px-3.5 py-2 shadow-[var(--shadow-sm)] select-none transition-all duration-200 ${searchActive ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg)]" : ""} ${selected ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg)]" : ""} ${selectMode ? "cursor-pointer" : ""}`}
        style={{
          background: isMe ? "var(--bubble-sent)" : "var(--bubble-received)",
          color: isMe ? "var(--bubble-sent-text)" : "var(--bubble-received-text)",
          border: isMe ? "none" : "1px solid var(--bubble-received-border)",
          borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        }}
      >
        {message.forwarded && !message.deleted && (
          <div className="mb-1 text-[11px] font-medium" style={{ color: "var(--accent)" }}>Forwarded</div>
        )}
        {message.replyTo && !message.deleted && (
          <div
            onClick={handleReplyClick}
            role={message.replyTo?.id ? "button" : undefined}
            tabIndex={message.replyTo?.id ? 0 : undefined}
            className={`mb-2 flex min-w-0 items-stretch overflow-hidden rounded-[10px] border ${message.replyTo?.id ? "cursor-pointer transition-colors hover:brightness-110" : ""}` }
            style={{
              background: isMe
                ? "color-mix(in srgb, var(--accent-text) 10%, transparent)"
                : "var(--surface-2)",
              borderColor: isMe
                ? "color-mix(in srgb, var(--accent-text) 16%, transparent)"
                : "var(--border)",
            }}
          >
            <div
              className="w-0.5 shrink-0"
              style={{ background: "var(--accent)" }}
            />

            <div className="min-w-0 flex-1 px-2.5 py-1.5">
              <p
                className="mb-0.5 text-[10.5px] font-semibold leading-tight"
                style={{
                  color: isMe
                    ? "var(--bubble-sent-text)"
                    : "var(--accent)",
                  opacity: isMe ? 0.9 : 1,
                }}
              >
                {message.replyTo.from === "me" ? "You" : "Replying to message"}
              </p>

              <p
                className="truncate text-[11.5px] leading-snug"
                style={{
                  color: isMe
                    ? "var(--bubble-sent-text)"
                    : "var(--text-muted)",
                  opacity: isMe ? 0.82 : 1,
                }}
              >
                {message.replyTo.text}
              </p>
            </div>
          </div>
        )}
        {showAuthor && message.author && !message.deleted && (
          <div className="text-[12px] font-medium mb-0.5" style={{ color: "var(--accent)" }}>
            {message.author}
          </div>
        )}
        {message.deleted ? (
          <p
            className="text-[13.5px] italic leading-snug"
            style={{ color: isMe ? "var(--bubble-sent-text)" : "var(--text-muted)", opacity: 0.75 }}
          >
            This message was deleted
          </p>
        ) : (
          <p className="text-[14.5px] leading-snug whitespace-pre-wrap break-words">{message.text}</p>
        )}
        <div
          className={`mt-1 flex items-center gap-1 text-[11px] ${isMe ? "justify-end" : "justify-start"}`}
          style={{ color: isMe ? "var(--bubble-sent-text)" : "var(--text-faint)", opacity: isMe ? 0.72 : 1 }}
        >
          <span>{message.time}</span>
          {isMe && !message.deleted && <StatusIcon status={message.status} />}
        </div>
      </div>
    </div>
  );
}
