import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    Check,
    CheckCheck,
    UserRound,
    Play,
    Pause,
    Volume1,
    Volume2,
    VolumeX,
    X,
    Maximize,
    Minimize,
    ImageOff,
    VideoOff,
} from "lucide-react";

const LONG_PRESS_MS = 450;
const LONG_PRESS_MOVE_TOLERANCE = 10;

/* -------------------------------------------------------------------------- */
/*  Media UI (thumbnails, audio card, lightbox, video player)                 */
/*  All styling lives in index.css under the `tv-` prefix.                    */
/* -------------------------------------------------------------------------- */

const VIEWER_CLOSE_MS = 220; // keep in sync with .tv-viewer transitions
const CONTROLS_IDLE_MS = 2600;

function formatDuration(seconds) {
    if (!Number.isFinite(seconds)) return "0:00";
    const total = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = String(total % 60).padStart(2, "0");
    if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${secs}`;
    return `${minutes}:${secs}`;
}

function prefersReducedMotion() {
    return typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

// Ask the browser to decode an early frame so <video> thumbnails aren't blank (iOS Safari).
function withPosterFrame(url) {
    return typeof url === "string" && !url.includes("#") ? `${url}#t=0.1` : url;
}

const stopEvent = (e) => e.stopPropagation();

// Only one audio message plays at a time.
let activeAudio = null;

/**
 * Mirrors a <audio>/<video> element into React state. State is derived from the
 * element's own events, so it stays correct when playback is changed elsewhere
 * (another player starting, ended, OS media keys, errors...).
 */
function useMediaElement(ref, { exclusive = false, resetOnEnd = false } = {}) {
    const [playing, setPlaying] = useState(false);
    const [current, setCurrent] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [muted, setMuted] = useState(false);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;

        let probing = false;

        const syncDuration = () => {
            const d = el.duration;
            if (Number.isFinite(d)) {
                setDuration(d);
            } else if (d === Infinity && !probing) {
                // Some containers (streamed webm etc.) report Infinity until scanned to the end.
                probing = true;
                const restore = () => {
                    el.removeEventListener("timeupdate", restore);
                    probing = false;
                    el.currentTime = 0;
                    if (Number.isFinite(el.duration)) setDuration(el.duration);
                };
                el.addEventListener("timeupdate", restore);
                el.currentTime = 1e101;
            }
        };

        const onMeta = () => {
            setFailed(false);
            syncDuration();
        };
        const onTime = () => {
            if (!probing) setCurrent(el.currentTime || 0);
        };
        const onPlay = () => {
            setPlaying(true);
            if (exclusive) {
                if (activeAudio && activeAudio !== el) activeAudio.pause();
                activeAudio = el;
            }
        };
        const onPause = () => setPlaying(false);
        const onEnded = () => {
            setPlaying(false);
            if (resetOnEnd) {
                el.currentTime = 0;
                setCurrent(0);
            }
        };
        const onVolume = () => {
            setVolume(el.volume);
            setMuted(el.muted);
        };
        const onError = () => setFailed(true);

        el.addEventListener("loadedmetadata", onMeta);
        el.addEventListener("durationchange", syncDuration);
        el.addEventListener("timeupdate", onTime);
        el.addEventListener("play", onPlay);
        el.addEventListener("pause", onPause);
        el.addEventListener("ended", onEnded);
        el.addEventListener("volumechange", onVolume);
        el.addEventListener("error", onError);

        // Metadata may already be available (cached media) before listeners attach.
        if (el.readyState >= 1) onMeta();
        onVolume();

        return () => {
            el.removeEventListener("loadedmetadata", onMeta);
            el.removeEventListener("durationchange", syncDuration);
            el.removeEventListener("timeupdate", onTime);
            el.removeEventListener("play", onPlay);
            el.removeEventListener("pause", onPause);
            el.removeEventListener("ended", onEnded);
            el.removeEventListener("volumechange", onVolume);
            el.removeEventListener("error", onError);
            if (activeAudio === el) activeAudio = null;
        };
    }, [ref, exclusive, resetOnEnd]);

    const toggle = useCallback(() => {
        const el = ref.current;
        if (!el) return;
        if (el.paused || el.ended) el.play().catch(() => {});
        else el.pause();
    }, [ref]);

    const seekRatio = useCallback((ratio) => {
        const el = ref.current;
        if (!el || !Number.isFinite(el.duration) || !el.duration) return;
        el.currentTime = Math.min(Math.max(ratio, 0), 1) * el.duration;
        setCurrent(el.currentTime);
    }, [ref]);

    const seekBy = useCallback((delta) => {
        const el = ref.current;
        if (!el || !Number.isFinite(el.duration) || !el.duration) return;
        el.currentTime = Math.min(Math.max(el.currentTime + delta, 0), el.duration);
        setCurrent(el.currentTime);
    }, [ref]);

    const changeVolume = useCallback((next) => {
        const el = ref.current;
        if (!el) return;
        const v = Math.min(Math.max(next, 0), 1);
        el.volume = v;
        el.muted = v === 0;
    }, [ref]);

    const toggleMute = useCallback(() => {
        const el = ref.current;
        if (!el) return;
        if (el.muted || el.volume === 0) {
            el.muted = false;
            if (el.volume === 0) el.volume = 0.6;
        } else {
            el.muted = true;
        }
    }, [ref]);

    return { playing, current, duration, volume, muted, failed, toggle, seekRatio, seekBy, changeVolume, toggleMute };
}

/** Styled <input type="range"> (value / onChange work in 0-100). */
function RangeBar({ value, onChange, label, valueText, className = "" }) {
    const pct = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
    return (
        <input
            type="range"
            min={0}
            max={100}
            step="any"
            value={pct}
            onChange={(e) => onChange(Number(e.target.value))}
            // keep the long-press "message menu" timer from firing while scrubbing
            onTouchStart={stopEvent}
            className={`tv-range ${className}`}
            style={{ "--p": `${pct}%` }}
            aria-label={label}
            aria-valuetext={valueText}
        />
    );
}

function VolumeControl({ media, label, buttonClass }) {
    const level = media.muted ? 0 : media.volume;
    const Icon = level === 0 ? VolumeX : level < 0.5 ? Volume1 : Volume2;
    return (
        <div className="tv-vol">
            <button
                type="button"
                onClick={media.toggleMute}
                className={buttonClass}
                aria-label={level === 0 ? `Unmute ${label}` : `Mute ${label}`}
            >
                <Icon size={16} />
            </button>
            <RangeBar
                className="tv-vol-range"
                value={level * 100}
                onChange={(v) => media.changeVolume(v / 100)}
                label={`${label} volume`}
                valueText={`${Math.round(level * 100)}%`}
            />
        </div>
    );
}

/* ------------------------------ Audio message ------------------------------ */

function AudioPlayer({ src, isMe, footer }) {
    const audioRef = useRef(null);
    const media = useMediaElement(audioRef, { exclusive: true, resetOnEnd: true });
    const pct = media.duration ? (media.current / media.duration) * 100 : 0;

    return (
        <div className={`tv-audio ${isMe ? "tv-audio-me" : ""} ${media.failed ? "is-failed" : ""}`}>
            {/* no `controls` attribute: the native browser UI is never shown */}
            <audio ref={audioRef} src={src} preload="metadata" />
            <div className="tv-audio-grid">
                <button
                    type="button"
                    onClick={media.toggle}
                    disabled={media.failed}
                    className="tv-audio-play"
                    aria-label={media.playing ? "Pause audio" : "Play audio"}
                >
                    {media.playing
                        ? <Pause size={17} fill="currentColor" />
                        : <Play size={17} fill="currentColor" className="tv-nudge" />}
                </button>

                <RangeBar
                    className="tv-audio-seek"
                    value={pct}
                    onChange={(v) => media.seekRatio(v / 100)}
                    label="Audio progress"
                    valueText={`${formatDuration(media.current)} of ${formatDuration(media.duration)}`}
                />

                <div className="tv-audio-info">
                    <span className="tv-time">
                        {media.failed ? "Unavailable" : `${formatDuration(media.current)} / ${formatDuration(media.duration)}`}
                    </span>
                </div>
            </div>
            {footer}
        </div>
    );
}

/* ------------------------- Image / video thumbnail -------------------------- */

function MediaThumb({ kind, media, onOpen, overlay }) {
    const isVideo = kind === "video";
    const [failed, setFailed] = useState(false);
    const [duration, setDuration] = useState(0);

    return (
        <div className="tv-thumb">
            {failed ? (
                <div className="tv-thumb-fallback">
                    {isVideo ? <VideoOff size={26} /> : <ImageOff size={26} />}
                    <span>{isVideo ? "Video unavailable" : "Image unavailable"}</span>
                </div>
            ) : isVideo ? (
                <video
                    className="tv-thumb-media"
                    src={withPosterFrame(media.url)}
                    preload="metadata"
                    muted
                    playsInline
                    tabIndex={-1}
                    aria-hidden="true"
                    disablePictureInPicture
                    onLoadedMetadata={(e) => {
                        const d = e.currentTarget.duration;
                        if (Number.isFinite(d)) setDuration(d);
                    }}
                    onError={() => setFailed(true)}
                />
            ) : (
                <img
                    className="tv-thumb-media"
                    src={media.url}
                    alt={media.fileName || "Image"}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    onError={() => setFailed(true)}
                />
            )}

            {!failed && (
                <button
                    type="button"
                    className="tv-thumb-hit"
                    onClick={onOpen}
                    aria-label={isVideo ? "Open video" : "Open image"}
                />
            )}
            {isVideo && !failed && (
                <span className="tv-thumb-play" aria-hidden="true">
                    <Play size={20} fill="currentColor" />
                </span>
            )}
            {isVideo && !failed && duration > 0 && (
                <span className="tv-chip tv-chip-left">{formatDuration(duration)}</span>
            )}
            {overlay}
        </div>
    );
}

/* ------------------------------ Video player ------------------------------- */

function VideoPlayer({ src }) {
    const wrapRef = useRef(null);
    const videoRef = useRef(null);
    const lastPokeRef = useRef(0);
    const hiddenRef = useRef(false);
    const pressRef = useRef({ hidden: false, touch: false });
    const media = useMediaElement(videoRef);
    const mediaRef = useRef(media); // latest controller for the (stable) keyboard listener
    const [ratio, setRatio] = useState(16 / 9);
    const [activity, setActivity] = useState(0); // bumped on pointer / keyboard activity
    const [idleKey, setIdleKey] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const canFullscreen =
        typeof document !== "undefined" &&
        (document.fullscreenEnabled ||
            (typeof HTMLVideoElement !== "undefined" && "webkitEnterFullscreen" in HTMLVideoElement.prototype));

    // Controls fade out while playing and nothing has happened for a while. "Hidden" is derived:
    // the idle timer records the activity key it was started for, and any activity (or a
    // play/pause change) produces a new key, which shows the controls again.
    const activityKey = `${activity}:${media.playing}`;

    const poke = useCallback(() => {
        const now = performance.now();
        if (now - lastPokeRef.current < 200) return; // pointermove fires a lot; don't re-render for each
        lastPokeRef.current = now;
        setActivity((n) => n + 1);
    }, []);

    useEffect(() => {
        if (!media.playing) return undefined;
        const timer = window.setTimeout(() => setIdleKey(activityKey), CONTROLS_IDLE_MS);
        return () => window.clearTimeout(timer);
    }, [activityKey, media.playing]);

    useEffect(() => {
        mediaRef.current = media;
    });

    // Opening a video is a user gesture, so start playing right away.
    useEffect(() => {
        videoRef.current?.play().catch(() => {});
    }, []);

    const toggleFullscreen = useCallback(() => {
        const wrap = wrapRef.current;
        const video = videoRef.current;
        if (document.fullscreenElement) {
            document.exitFullscreen?.()?.catch?.(() => {});
        } else if (wrap?.requestFullscreen) {
            wrap.requestFullscreen().catch(() => {});
        } else if (video?.webkitEnterFullscreen) {
            video.webkitEnterFullscreen(); // iPhone Safari only supports fullscreen on the <video> itself
        }
    }, []);

    useEffect(() => {
        const wrap = wrapRef.current;
        const onChange = () => setIsFullscreen(document.fullscreenElement === wrap);
        document.addEventListener("fullscreenchange", onChange);
        return () => {
            document.removeEventListener("fullscreenchange", onChange);
            if (document.fullscreenElement === wrap) document.exitFullscreen?.()?.catch?.(() => {});
        };
    }, []);

    // Keyboard: space/k play, ←/→ seek, ↑/↓ volume, m mute, f fullscreen (Esc is handled by the viewer).
    useEffect(() => {
        const onKey = (e) => {
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            const media = mediaRef.current;
            const tag = e.target?.tagName;
            const onButton = tag === "BUTTON";
            const onRange = tag === "INPUT";
            const key = e.key.toLowerCase();

            if ((key === " " || key === "k") && !onButton) {
                e.preventDefault();
                media.toggle();
            } else if (key === "arrowleft" && !onRange) {
                e.preventDefault();
                media.seekBy(-5);
            } else if (key === "arrowright" && !onRange) {
                e.preventDefault();
                media.seekBy(5);
            } else if (key === "arrowup" && !onRange) {
                e.preventDefault();
                media.changeVolume((media.muted ? 0 : media.volume) + 0.1);
            } else if (key === "arrowdown" && !onRange) {
                e.preventDefault();
                media.changeVolume((media.muted ? 0 : media.volume) - 0.1);
            } else if (key === "m" && !onButton) {
                media.toggleMute();
            } else if (key === "f" && !onButton && canFullscreen) {
                toggleFullscreen();
            } else {
                return;
            }
            poke();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [poke, toggleFullscreen, canFullscreen]);

    const pct = media.duration ? (media.current / media.duration) * 100 : 0;
    const controlsHidden = media.playing && idleKey === activityKey;

    useEffect(() => {
        hiddenRef.current = controlsHidden;
    });

    return (
        <div
            ref={wrapRef}
            className="tv-player"
            data-idle={controlsHidden}
            style={{ "--ratio": ratio }}
            // Wake the controls on move / release (not on press) so a click never changes
            // target halfway through the gesture when hidden controls reappear under it.
            onPointerMove={poke}
            onPointerUp={poke}
            onPointerDown={(e) => {
                pressRef.current = { hidden: hiddenRef.current, touch: e.pointerType === "touch" };
            }}
        >
            <video
                ref={videoRef}
                src={src}
                className="tv-player-video"
                playsInline
                preload="metadata"
                onLoadedMetadata={(e) => {
                    const { videoWidth: w, videoHeight: h } = e.currentTarget;
                    if (w && h) setRatio(Math.min(4, Math.max(0.3, w / h)));
                }}
                onClick={() => {
                    // On touch, the first tap while the controls are hidden only reveals them.
                    if (pressRef.current.hidden && pressRef.current.touch) {
                        poke();
                        return;
                    }
                    media.toggle();
                    poke();
                }}
                onDoubleClick={canFullscreen ? toggleFullscreen : undefined}
            />

            <button
                type="button"
                onClick={media.toggle}
                className="tv-bigplay"
                data-visible={!media.playing && !media.failed}
                aria-label="Play video"
                tabIndex={media.playing ? -1 : 0}
            >
                <Play size={28} fill="currentColor" className="tv-nudge" />
            </button>

            {media.failed && <div className="tv-player-error">This video couldn’t be played</div>}

            <div className="tv-controls" onClick={stopEvent}>
                <RangeBar
                    className="tv-controls-seek"
                    value={pct}
                    onChange={(v) => media.seekRatio(v / 100)}
                    label="Video progress"
                    valueText={`${formatDuration(media.current)} of ${formatDuration(media.duration)}`}
                />
                <div className="tv-controls-row">
                    <button
                        type="button"
                        onClick={media.toggle}
                        className="tv-ctl"
                        aria-label={media.playing ? "Pause video" : "Play video"}
                    >
                        {media.playing
                            ? <Pause size={18} fill="currentColor" />
                            : <Play size={18} fill="currentColor" className="tv-nudge" />}
                    </button>

                    <span className="tv-time">
                        {formatDuration(media.current)}
                        <span className="tv-time-total"> / {formatDuration(media.duration)}</span>
                    </span>

                    <span className="tv-spacer" />

                    <VolumeControl media={media} label="video" buttonClass="tv-ctl" />

                    {canFullscreen && (
                        <button
                            type="button"
                            onClick={toggleFullscreen}
                            className="tv-ctl"
                            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                        >
                            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ------------------------- Lightbox (image + video) ------------------------- */

/**
 * Rendered through a portal into <body>. It must not live inside the message row:
 * rows carry `transform`s (bubble-in animation, list rubber-banding) which would
 * turn `position: fixed` into "fixed relative to the row" and let the composer
 * and header paint over it.
 */
function MediaViewer({ media, type, origin, onClose }) {
    const rootRef = useRef(null);
    const returnFocusRef = useRef(null);
    const closeTimerRef = useRef(null);
    const closingRef = useRef(false);
    const onCloseRef = useRef(onClose);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        onCloseRef.current = onClose;
    });

    const requestClose = useCallback(() => {
        if (closingRef.current) return;
        closingRef.current = true;
        setOpen(false); // runs the fade + scale-out transition
        closeTimerRef.current = window.setTimeout(
            () => onCloseRef.current?.(),
            prefersReducedMotion() ? 0 : VIEWER_CLOSE_MS
        );
    }, []);

    // Mount: lock scroll, move focus in, then flip to the "open" state for the transition.
    useEffect(() => {
        const root = rootRef.current;
        if (!returnFocusRef.current) returnFocusRef.current = document.activeElement;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        root?.getBoundingClientRect(); // flush the closed styles so the transition actually runs
        const raf = requestAnimationFrame(() => setOpen(true));
        root?.focus({ preventScroll: true });

        return () => {
            cancelAnimationFrame(raf);
            window.clearTimeout(closeTimerRef.current);
            document.body.style.overflow = prevOverflow;
            returnFocusRef.current?.focus?.({ preventScroll: true });
        };
    }, []);

    // Esc closes; Tab stays inside the dialog.
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") {
                e.preventDefault();
                requestClose();
                return;
            }
            if (e.key !== "Tab") return;
            const root = rootRef.current;
            if (!root) return;
            const nodes = root.querySelectorAll('button:not([disabled]):not([tabindex="-1"]), input:not([disabled])');
            if (!nodes.length) {
                e.preventDefault();
                return;
            }
            const first = nodes[0];
            const last = nodes[nodes.length - 1];
            const active = document.activeElement;
            if (e.shiftKey && (active === first || active === root)) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && active === last) {
                e.preventDefault();
                first.focus();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [requestClose]);

    return createPortal(
        <div
            ref={rootRef}
            className="tv-viewer"
            data-open={open}
            role="dialog"
            aria-modal="true"
            aria-label={type === "video" ? "Video viewer" : "Image viewer"}
            tabIndex={-1}
            style={origin ? { "--tv-ox": `${origin.x}px`, "--tv-oy": `${origin.y}px` } : undefined}
            onClick={(e) => {
                e.stopPropagation();
                requestClose();
            }}
            // React events bubble through portals to the message row's ancestors; keep them contained.
            onTouchStart={stopEvent}
            onTouchMove={stopEvent}
            onTouchEnd={stopEvent}
            onContextMenu={stopEvent}
        >
            <div className="tv-viewer-backdrop" />

            <div className="tv-viewer-stage">
                <div className="tv-viewer-content" onClick={stopEvent}>
                    {type === "video" ? (
                        <VideoPlayer src={media.url} />
                    ) : (
                        <img
                            src={media.url}
                            alt={media.fileName || "Image"}
                            className="tv-viewer-img"
                            draggable={false}
                        />
                    )}
                </div>
            </div>

            <button
                type="button"
                className="tv-viewer-close"
                onClick={(e) => {
                    e.stopPropagation();
                    requestClose();
                }}
                aria-label="Close viewer"
            >
                <X size={20} />
            </button>
        </div>,
        document.body
    );
}

function StatusIcon({ status, isGroup, seenCount = 0 }) {
    if (status === "read") {
        if (isGroup) {
            return (
                <span className="inline-flex items-center gap-0.5">
                    <UserRound size={11} strokeWidth={2.3} />
                    {seenCount > 0 && <span className="text-[10px] leading-none">{seenCount}</span>}
                </span>
            );
        }
        return <UserRound size={12} strokeWidth={2.3} />;
    }

    if (status === "delivered") {
        return <CheckCheck size={15} strokeWidth={2.5} style={{ opacity: 0.92 }} />;
    }

    return <Check size={14} strokeWidth={2.2} style={{ opacity: 0.7 }} />;
}

export default function MessageBubble({ message, showAuthor, animate, onMenu, onReplyNavigate, searchActive = false, selected = false, selectMode = false, onToggleSelect }) {
    const isMe = message.from === "me";
    const pressTimerRef = useRef(null);
    const pressStartRef = useRef({ x: 0, y: 0 });
    const longPressFiredRef = useRef(false);
    const [viewer, setViewer] = useState(null);
    const hasMedia = !message.deleted && Boolean(message.media?.url);
    const isImage = hasMedia && message.type === "image";
    const isVideo = hasMedia && message.type === "video";
    const isAudio = hasMedia && message.type === "audio";
    const isVisualMedia = isImage || isVideo;
    const isMediaBubble = isVisualMedia || isAudio;
    const hasHeader = !message.deleted && Boolean(message.forwarded || message.replyTo || (showAuthor && message.author));
    // A media message with no reply/forward/author header is shown "frameless" (no bubble chrome).
    const isFrameless = isMediaBubble && !hasHeader;

    const openViewer = (type) => (e) => {
        if (selectMode) return; // in selection mode a tap toggles selection (handled by the bubble)
        if (longPressFiredRef.current) {
            longPressFiredRef.current = false; // this tap ended a long-press that already opened the menu
            return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        setViewer({
            type,
            media: message.media,
            origin: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
        });
    };

    // Timestamp / edited / status cluster, reused by every layout below.
    const metaContent = (
        <>
            {message.edited && !message.deleted && (
                <span className="font-medium" style={{ opacity: 0.8 }}>Edited</span>
            )}
            <span>{message.time}</span>
            {isMe && !message.deleted && <StatusIcon status={message.status} isGroup={message.isGroup} seenCount={message.seenCount} />}
        </>
    );

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
                className={`${isMediaBubble ? `tv-bubble-media ${isAudio ? "tv-bubble-audio" : ""} max-w-[78%] sm:max-w-[65%] ${isFrameless ? "tv-frameless p-0 shadow-none" : "p-1.5 shadow-[var(--shadow-sm)]"}` : "max-w-[78%] sm:max-w-[65%] px-3.5 py-2 shadow-[var(--shadow-sm)]"} select-none transition-all duration-200 ${searchActive ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg)]" : ""} ${selected ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg)]" : ""} ${selectMode ? "cursor-pointer" : ""}`}
                style={{
                    background: isFrameless ? "transparent" : (isMe ? "var(--bubble-sent)" : "var(--bubble-received)"),
                    color: isMe ? "var(--bubble-sent-text)" : "var(--bubble-received-text)",
                    border: isFrameless ? "none" : (isMe ? "none" : "1px solid var(--bubble-received-border)"),
                    borderRadius: isFrameless ? 16 : (isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px"),
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
                        className={`mb-2 flex min-w-0 items-stretch overflow-hidden rounded-[10px] border ${message.replyTo?.id ? "cursor-pointer transition-colors hover:brightness-110" : ""}`}
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
                {isVisualMedia && (
                    <MediaThumb
                        key={message.media.url} // remount (clears the "failed" state) if the url changes
                        kind={isVideo ? "video" : "image"}
                        media={message.media}
                        onOpen={openViewer(isVideo ? "video" : "image")}
                        overlay={<span className="tv-chip tv-chip-right">{metaContent}</span>}
                    />
                )}

                {isAudio && (
                    <AudioPlayer
                        src={message.media.url}
                        isMe={isMe}
                        footer={<div className="tv-audio-meta">{metaContent}</div>}
                    />
                )}

                {!message.deleted && message.type === "file" && message.media?.url && (
                    <a
                        href={message.media.url}
                        download={message.media.fileName || true}
                        target="_blank"
                        rel="noreferrer"
                        className="mb-1 flex min-w-[190px] items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors hover:brightness-110"
                        style={{ borderColor: isMe ? "color-mix(in srgb, var(--bubble-sent-text) 18%, transparent)" : "var(--border)" }}
                    >
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg" style={{ background: "var(--surface-2)", color: "var(--accent)" }}>
                            <span className="text-[11px] font-bold">FILE</span>
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-[12px] font-medium">{message.media.fileName || "File"}</p>
                            <p className="text-[10px] opacity-70">Download</p>
                        </div>
                    </a>
                )}

                {message.type === "text" || !message.type ? null : null}

                {message.deleted ? (
                    <p
                        className="text-[13.5px] italic leading-snug"
                        style={{ color: isMe ? "var(--bubble-sent-text)" : "var(--text-muted)", opacity: 0.75 }}
                    >
                        This message was deleted
                    </p>
                ) : (
                    message.type === "text" || !message.type ? (
                        <p className="text-[14.5px] leading-snug whitespace-pre-wrap break-words">{message.text}</p>
                    ) : null
                )}
                {!isMediaBubble && (
                    <div
                        className={`mt-1 flex items-center gap-1 text-[11px] ${isMe ? "justify-end" : "justify-start"}`}
                        style={{ color: isMe ? "var(--bubble-sent-text)" : "var(--text-faint)", opacity: isMe ? 0.72 : 1 }}
                    >
                        {metaContent}
                    </div>
                )}
            </div>
            {viewer && (
                <MediaViewer
                    type={viewer.type}
                    media={viewer.media}
                    origin={viewer.origin}
                    onClose={() => setViewer(null)}
                />
            )}
        </div>
    );
}