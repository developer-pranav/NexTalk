import { useEffect, useRef, useState } from "react";
import {
    Camera,
    Image as ImageIcon,
    MapPin,
    Mic,
    Music2,
    Pause,
    Play,
    Plus,
    SendHorizontal,
    Square,
    Trash2,
    UserRound,
    Video,
} from "lucide-react";
import ActionMenu from "./ActionMenu";

const RECORDING_MIME_TYPES = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
];

function getRecordingMimeType() {
    if (typeof MediaRecorder === "undefined") return "";
    return RECORDING_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported?.(type)) || "";
}

function formatRecordingTime(seconds) {
    const total = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(total / 60);
    const secs = total % 60;
    return `${minutes}:${String(secs).padStart(2, "0")}`;
}

export default function MessageInput({
    onSend,
    onSendMedia,
    disabled,
    disabledMessage,
    onNotify,
    replyTo = null,
    onCancelReply,
    editingMessage = null,
    onEdit,
    onCancelEdit,
    onTyping,
    onMediaUploading,
}) {
    const [value, setValue] = useState("");
    const [attachmentOpen, setAttachmentOpen] = useState(false);
    const [recording, setRecording] = useState(false);
    const [recordingPaused, setRecordingPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [recordingBusy, setRecordingBusy] = useState(false);

    const taRef = useRef(null);
    const plusRef = useRef(null);
    const fileInputRef = useRef(null);
    const recorderRef = useRef(null);
    const streamRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);
    const cancelRecordingRef = useRef(false);
    const fileAcceptRef = useRef("");
    const [fileAccept, setFileAccept] = useState("");

    const hasText = value.trim().length > 0;

    useEffect(() => {
        if (editingMessage) {
            setValue(editingMessage.text || "");

            requestAnimationFrame(() => {
                if (taRef.current) {
                    grow(taRef.current);
                    taRef.current.focus();

                    const length = taRef.current.value.length;
                    taRef.current.setSelectionRange(length, length);
                }
            });
        } else {
            setValue("");

            requestAnimationFrame(() => {
                if (taRef.current) {
                    taRef.current.style.height = "auto";
                }
            });
        }
    }, [editingMessage]);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            streamRef.current?.getTracks?.().forEach((track) => track.stop());
            if (recorderRef.current?.state === "recording" || recorderRef.current?.state === "paused") {
                cancelRecordingRef.current = true;
                try {
                    recorderRef.current.stop();
                } catch {}
            }
        };
    }, []);

    const grow = (el) => {
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    };

    const handleChange = (e) => {
        setValue(e.target.value);
        grow(e.target);
        onTyping?.(e.target.value);
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

    const pickFile = (accept) => {
        setFileAccept(accept);
        fileAcceptRef.current = accept;
        setAttachmentOpen(false);
        requestAnimationFrame(() => fileInputRef.current?.click());
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        onMediaUploading?.(true, file);
        try {
            await onSendMedia?.(file);
        } finally {
            onMediaUploading?.(false, file);
        }
    };

    const clearRecordingTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const cleanupRecording = () => {
        clearRecordingTimer();
        streamRef.current?.getTracks?.().forEach((track) => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
        chunksRef.current = [];
    };

    const startRecording = async () => {
        if (recording || recordingBusy) return;

        if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
            onNotify?.("Voice recording isn't supported in this browser.");
            return;
        }

        setRecordingBusy(true);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mimeType = getRecordingMimeType();
            const recorder = mimeType
                ? new MediaRecorder(stream, { mimeType })
                : new MediaRecorder(stream);

            streamRef.current = stream;
            recorderRef.current = recorder;
            chunksRef.current = [];
            cancelRecordingRef.current = false;

            recorder.ondataavailable = (event) => {
                if (event.data?.size) chunksRef.current.push(event.data);
            };

            recorder.onerror = () => {
                cancelRecordingRef.current = true;
                cleanupRecording();
                setRecording(false);
                setRecordingPaused(false);
                setRecordingTime(0);
                onNotify?.("Voice recording failed.");
            };

            recorder.onstop = async () => {
                const shouldSend = !cancelRecordingRef.current;
                const chunks = chunksRef.current.slice();
                const type = recorder.mimeType || mimeType || "audio/webm";

                cleanupRecording();
                setRecording(false);
                setRecordingPaused(false);
                setRecordingTime(0);
                setRecordingBusy(false);

                if (!shouldSend || !chunks.length) return;

                const blob = new Blob(chunks, { type });
                if (!blob.size) return;

                const extension = type.includes("mp4") ? "m4a" : "webm";
                const file = new File(
                    [blob],
                    `voice-message-${Date.now()}.${extension}`,
                    { type }
                );

                onMediaUploading?.(true, file);
                try {
                    const sent = await onSendMedia?.(file);
                    if (!sent) {
                        onNotify?.("Voice message could not be sent.");
                    }
                } catch (error) {
                    onNotify?.(error?.message || "Voice message could not be sent.");
                } finally {
                    onMediaUploading?.(false, file);
                }
            };

            recorder.start(250);
            setRecording(true);
            setRecordingPaused(false);
            setRecordingTime(0);

            clearRecordingTimer();
            timerRef.current = setInterval(() => {
                setRecordingTime((current) => current + 1);
            }, 1000);

            // getUserMedia setup is complete; the controls must be interactive
            // while the recorder is actively recording. recordingBusy is only
            // used for the short send/stop transition.
            setRecordingBusy(false);
        } catch (error) {
            cleanupRecording();
            setRecording(false);
            setRecordingPaused(false);
            setRecordingTime(0);
            setRecordingBusy(false);

            if (error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError") {
                onNotify?.("Microphone permission was denied.");
            } else {
                onNotify?.("Couldn't start voice recording.");
            }
        }
    };

    const toggleRecordingPause = () => {
        const recorder = recorderRef.current;
        if (!recorder || recordingBusy) return;

        if (recorder.state === "recording" && recorder.pause) {
            recorder.pause();
            clearRecordingTimer();
            setRecordingPaused(true);
        } else if (recorder.state === "paused" && recorder.resume) {
            recorder.resume();
            setRecordingPaused(false);
            clearRecordingTimer();
            timerRef.current = setInterval(() => {
                setRecordingTime((current) => current + 1);
            }, 1000);
        }
    };

    const cancelRecording = () => {
        const recorder = recorderRef.current;
        if (!recorder) return;

        cancelRecordingRef.current = true;
        setRecordingBusy(true);
        clearRecordingTimer();

        if (recorder.state === "recording" || recorder.state === "paused") {
            try {
                recorder.stop();
            } catch {
                cleanupRecording();
                setRecording(false);
                setRecordingPaused(false);
                setRecordingTime(0);
                setRecordingBusy(false);
            }
        } else {
            cleanupRecording();
            setRecording(false);
            setRecordingPaused(false);
            setRecordingTime(0);
            setRecordingBusy(false);
        }
    };

    const sendRecording = () => {
        const recorder = recorderRef.current;
        if (!recorder || recordingBusy) return;

        cancelRecordingRef.current = false;
        setRecordingBusy(true);
        clearRecordingTimer();

        if (recorder.state === "recording" || recorder.state === "paused") {
            try {
                recorder.stop();
            } catch {
                cancelRecordingRef.current = true;
                cleanupRecording();
                setRecording(false);
                setRecordingPaused(false);
                setRecordingTime(0);
                setRecordingBusy(false);
            }
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
        }
    };

    if (disabled) {
        return (
            <div className="relative shrink-0 px-3 py-3 sm:px-5">
                <div
                    className="mx-auto flex max-w-6xl items-center justify-center rounded-full py-2.5 text-[13px]"
                    style={{
                        background: "var(--surface)",
                        color: "var(--text-muted)",
                        border: "1px solid var(--border)",
                    }}
                >
                    {disabledMessage || "You can't message this contact"}
                </div>
            </div>
        );
    }

    return (
        <div className="relative mx-3 my-3 shrink-0 sm:mx-5">
            {editingMessage && (
                <div
                    className="mx-auto mb-2 flex max-w-3xl items-center gap-2 rounded-xl border px-3 py-2"
                    style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                >
                    <div className="min-w-0 flex-1 border-l-2 pl-2" style={{ borderColor: "var(--accent)" }}>
                        <p className="text-[11px] font-semibold" style={{ color: "var(--accent)" }}>Editing message</p>
                        <p className="truncate text-[12px]" style={{ color: "var(--text-muted)" }}>{editingMessage.text}</p>
                    </div>
                    <button type="button" onClick={onCancelEdit} className="grid h-7 w-7 shrink-0 place-items-center rounded-full" style={{ color: "var(--text-muted)" }} aria-label="Cancel edit">×</button>
                </div>
            )}

            {replyTo && (
                <div
                    className="mx-auto mb-2 flex max-w-3xl items-center gap-2 rounded-xl border px-3 py-2"
                    style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                >
                    <div className="min-w-0 flex-1 border-l-2 pl-2" style={{ borderColor: "var(--accent)" }}>
                        <p className="text-[11px] font-semibold" style={{ color: "var(--accent)" }}>Replying</p>
                        <p className="truncate text-[12px]" style={{ color: "var(--text-muted)" }}>{replyTo.text}</p>
                    </div>
                    <button type="button" onClick={onCancelReply} className="grid h-7 w-7 shrink-0 place-items-center rounded-full" style={{ color: "var(--text-muted)" }} aria-label="Cancel reply">×</button>
                </div>
            )}

            {recording ? (
                <div className={`tv-recorder mx-auto ${recordingPaused ? "is-paused" : ""}`}>
                    <button
                        type="button"
                        onClick={cancelRecording}
                        disabled={recordingBusy}
                        className="tv-recorder-action tv-recorder-cancel"
                        aria-label="Discard voice recording"
                    >
                        <Trash2 size={18} />
                    </button>

                    <div className="tv-recorder-main">
                        <div className="tv-recorder-topline">
                            <span className="tv-recorder-status">
                                <span className="tv-recorder-dot" aria-hidden="true" />
                                {recordingPaused ? "Paused" : "Recording"}
                            </span>
                            <span className="tv-recorder-time">{formatRecordingTime(recordingTime)}</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={toggleRecordingPause}
                        disabled={recordingBusy}
                        className="tv-recorder-action tv-recorder-pause"
                        aria-label={recordingPaused ? "Resume recording" : "Pause recording"}
                    >
                        {recordingPaused ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}
                    </button>

                    <button
                        type="button"
                        onClick={sendRecording}
                        disabled={recordingBusy}
                        className="tv-recorder-send"
                        aria-label="Send voice message"
                    >
                        {recordingBusy ? <span className="tv-recorder-spinner" aria-hidden="true" /> : <SendHorizontal size={18} />}
                    </button>
                </div>
            ) : (
                <div
                    className="flex max-w-3xl mx-auto items-center gap-1 rounded-full py-1.5 pl-1.5 pr-2"
                    style={{
                        background: "var(--surface)",
                        boxShadow: "var(--shadow-sm)",
                        border: "1px solid var(--border)",
                    }}
                >
                    <button
                        ref={plusRef}
                        type="button"
                        onClick={() => setAttachmentOpen((open) => !open)}
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-full transition-all duration-150 active:scale-90"
                        style={{
                            background: attachmentOpen ? "var(--accent-soft)" : "var(--surface-2)",
                            color: attachmentOpen ? "var(--accent)" : "var(--text-muted)",
                            transform: attachmentOpen ? "rotate(45deg)" : "rotate(0deg)",
                        }}
                        aria-label="Add attachment"
                    >
                        <Plus size={23} />
                    </button>

                    {attachmentOpen && plusRef.current && (
                        <ActionMenu
                            anchorRect={plusRef.current.getBoundingClientRect()}
                            placement="top"
                            width={235}
                            onClose={() => setAttachmentOpen(false)}
                            items={[
                                { key: "photo", label: "Photo", icon: ImageIcon, onClick: () => pickFile("image/*") },
                                { key: "video", label: "Video", icon: Video, onClick: () => pickFile("video/*") },
                                { key: "audio", label: "Audio", icon: Music2, onClick: () => pickFile("audio/*") },
                            ]}
                        />
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={fileAccept}
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    <textarea
                        ref={taRef}
                        rows={1}
                        value={value}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Message"
                        className="scroll-thin flex-1 resize-none bg-transparent py-3 text-[16px] leading-snug outline-none placeholder:text-[var(--text-faint)]"
                        style={{
                            color: "var(--text)",
                            maxHeight: 120,
                        }}
                    />

                    {hasText ? (
                        <button
                            type="button"
                            onClick={submit}
                            className="grid h-11 w-11 shrink-0 place-items-center rounded-full transition-all duration-200 active:scale-90"
                            style={{
                                background: "var(--accent)",
                                color: "var(--accent-text)",
                            }}
                            aria-label="Send message"
                        >
                            <SendHorizontal size={17} />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={startRecording}
                            disabled={recordingBusy}
                            className="tv-mic-button grid h-11 w-11 shrink-0 place-items-center rounded-full transition-all duration-200 active:scale-90"
                            style={{
                                background: "var(--accent)",
                                color: "var(--accent-text)",
                            }}
                            aria-label="Record voice message"
                        >
                            <Mic size={18} />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
