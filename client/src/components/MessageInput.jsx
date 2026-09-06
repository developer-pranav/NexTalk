import { useEffect, useRef, useState } from "react";
import {
    AudioLines,
    Camera,
    FileText,
    Image as ImageIcon,
    MapPin,
    Mic,
    Music2,
    Plus,
    SendHorizontal,
    UserRound,
    Video,
} from "lucide-react";
import ActionMenu from "./ActionMenu";

export default function MessageInput({
    onSend,
    disabled,
    disabledMessage,
    onNotify,
    replyTo = null,
    onCancelReply,
    editingMessage = null,
    onEdit,
    onCancelEdit,
}) {
    const [value, setValue] = useState("");
    const [attachmentOpen, setAttachmentOpen] = useState(false);
    const taRef = useRef(null);
    const plusRef = useRef(null);

    const hasText = value.trim().length > 0;

    useEffect(() => {
        if (editingMessage) {
            setValue(editingMessage.text || "");
            requestAnimationFrame(() => {
                if (taRef.current) {
                    grow(taRef.current);
                    taRef.current.focus();
                    taRef.current.setSelectionRange(taRef.current.value.length, taRef.current.value.length);
                }
            });
        }
    }, [editingMessage]);


    const grow = (el) => {
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    };

    const handleChange = (e) => {
        setValue(e.target.value);
        grow(e.target);
    };

    const submit = () => {
        if (!value.trim()) return;

        if (editingMessage) {
            onEdit?.(value);
        } else {
            onSend(value, replyTo);
        }

        setValue("");
        onCancelEdit?.();

        if (taRef.current) {
            taRef.current.style.height = "auto";
            taRef.current.focus();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
        }
    };

    {/* =========================================================
      BLOCKED STATE
  ========================================================== */}

    if (disabled) {
        return (
            <div
                className="
          relative
          shrink-0
          px-3
          py-3
          sm:px-5
        "
            >
                <div
                    className="
            flex
            max-w-3xl
            mx-auto
            items-center
            justify-center
            rounded-full
            py-2.5
            text-[13px]
          "
                    style={{
                        background: "var(--surface)",
                        color: "var(--text-muted)",
                        border: "1px solid var(--border)",
                    }}
                >
                    {disabledMessage ||
                        "You can't message this contact"}
                </div>
            </div>
        );
    }

    {/* =========================================================
      MESSAGE INPUT
  ========================================================== */}

    return (
        <div
            className="
        relative
        shrink-0
        mx-3
        my-3
        sm:mx-5
        transparent
      "
        >
            {editingMessage && (
                <div className="mx-auto mb-2 flex max-w-3xl items-center gap-2 rounded-xl border px-3 py-2" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                    <div className="min-w-0 flex-1 border-l-2 pl-2" style={{ borderColor: "var(--accent)" }}>
                        <p className="text-[11px] font-semibold" style={{ color: "var(--accent)" }}>Editing message</p>
                        <p className="truncate text-[12px]" style={{ color: "var(--text-muted)" }}>{editingMessage.text}</p>
                    </div>
                    <button type="button" onClick={onCancelEdit} className="grid h-7 w-7 shrink-0 place-items-center rounded-full" style={{ color: "var(--text-muted)" }} aria-label="Cancel edit">×</button>
                </div>
            )}
            {replyTo && (
                <div className="mx-auto mb-2 flex max-w-3xl items-center gap-2 rounded-xl border px-3 py-2" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                    <div className="min-w-0 flex-1 border-l-2 pl-2" style={{ borderColor: "var(--accent)" }}>
                        <p className="text-[11px] font-semibold" style={{ color: "var(--accent)" }}>Replying</p>
                        <p className="truncate text-[12px]" style={{ color: "var(--text-muted)" }}>{replyTo.text}</p>
                    </div>
                    <button type="button" onClick={onCancelReply} className="grid h-7 w-7 shrink-0 place-items-center rounded-full" style={{ color: "var(--text-muted)" }} aria-label="Cancel reply">×</button>
                </div>
            )}
            <div
                className="
          flex
          max-w-3xl
          mx-auto
          items-center
          gap-1
          rounded-full
          py-1.5
          pl-1.5
          pr-2
        "
                style={{
                    background: "var(--surface)",
                    boxShadow: "var(--shadow-sm)",
                    border: "1px solid var(--border)",
                }}
            >
                {/* Add attachment */}
                <button
                    ref={plusRef}
                    type="button"
                    onClick={() => setAttachmentOpen((open) => !open)}
                    className="
            grid
            h-9
            w-9
            shrink-0
            place-items-center
            rounded-full
            transition-all
            duration-150
            active:scale-90
          "
                    style={{
                        background: attachmentOpen ? "var(--accent-soft)" : "var(--surface-2)",
                        color: attachmentOpen ? "var(--accent)" : "var(--text-muted)",
                        transform: attachmentOpen ? "rotate(45deg)" : "rotate(0deg)",
                    }}
                    aria-label="Add attachment"
                >
                    <Plus size={19} />
                </button>

                {attachmentOpen && plusRef.current && (
                    <ActionMenu
                        anchorRect={plusRef.current.getBoundingClientRect()}
                        placement="top"
                        width={235}
                        onClose={() => setAttachmentOpen(false)}
                        items={[
                            { key: "photo", label: "Photo", icon: ImageIcon, onClick: () => onNotify?.("Photo picker coming soon") },
                            { key: "video", label: "Video", icon: Video, onClick: () => onNotify?.("Video picker coming soon") },
                            { key: "camera", label: "Camera", icon: Camera, onClick: () => onNotify?.("Camera coming soon") },
                            { key: "audio", label: "Audio", icon: Music2, onClick: () => onNotify?.("Audio picker coming soon") },
                            { key: "file", label: "File", icon: FileText, onClick: () => onNotify?.("File picker coming soon") },
                            { separator: true, key: "divider" },
                            { key: "location", label: "Location", icon: MapPin, onClick: () => onNotify?.("Location sharing coming soon") },
                            { key: "contact", label: "Contact", icon: UserRound, onClick: () => onNotify?.("Contact sharing coming soon") },
                        ]}
                    />
                )}

                {/* Textarea */}
                <textarea
                    ref={taRef}
                    rows={1}
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Message"
                    className="
            scroll-thin
            flex-1
            resize-none
            bg-transparent
            py-2
            text-[14.5px]
            leading-snug
            outline-none
            placeholder:text-[var(--text-faint)]
          "
                    style={{
                        color: "var(--text)",
                        maxHeight: 120,
                    }}
                />

                {/* Send / Voice */}
                {hasText ? (
                    <button
                        type="button"
                        onClick={submit}
                        className="
              grid
              h-9
              w-9
              shrink-0
              place-items-center
              rounded-full
              transition-all
              duration-200
              active:scale-90
            "
                        style={{
                            background: "var(--accent)",
                            color: "var(--accent-text)",
                        }}
                        aria-label="Send message"
                    >
                        <SendHorizontal size={17} />
                    </button>
                ) : (
                    <div className="flex shrink-0 items-center gap-1">
                        <button
                            type="button"
                            className="
                grid
                h-9
                w-9
                place-items-center
                rounded-full
                transition-colors
              "
                            style={{
                                color: "var(--text-muted)",
                            }}
                            aria-label="Voice message"
                        >

                        </button>

                        <button
                            type="button"
                            className="
                grid
                h-9
                w-9
                place-items-center
                rounded-full
                transition-all
                active:scale-90
              "
                            style={{
                                background: "var(--accent)",
                                color: "var(--accent-text)",
                            }}
                            aria-label="Voice mode"
                        >
                            <Mic size={18} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}