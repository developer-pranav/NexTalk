import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const GAP = 8;
const VIEWPORT_PAD = 12;
const ANIMATION_MS = 170;

function getViewport() {
    const vv = window.visualViewport;
    return {
        width: vv?.width || document.documentElement.clientWidth || window.innerWidth,
        height: vv?.height || document.documentElement.clientHeight || window.innerHeight,
        offsetLeft: vv?.offsetLeft || 0,
        offsetTop: vv?.offsetTop || 0,
    };
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export default function ActionMenu({
    items = [],
    anchorRect = null,
    point = null,
    onClose,
    width = 220,
    placement = "auto",
    className = "",
}) {
    const menuRef = useRef(null);
    const [closing, setClosing] = useState(false);
    const [position, setPosition] = useState(null);

    const requestClose = () => {
        if (closing) return;
        setClosing(true);
        onClose?.();
    };

    useLayoutEffect(() => {
        const menu = menuRef.current;
        const contextPoint = point && Number.isFinite(point.x) && Number.isFinite(point.y)
            ? { x: point.x, y: point.y }
            : null;
        if (!menu) return;

        if (!contextPoint && !anchorRect) {
            console.warn("[ActionMenu] opened with no anchorRect and no point — it will center itself.");
        }

        const updatePosition = () => {
            try {
                const { width: vw, height: vh, offsetLeft: vx, offsetTop: vy } = getViewport();
                const menuWidth = Math.min(width, Math.max(1, vw - VIEWPORT_PAD * 2));

                menu.style.width = `${menuWidth}px`;
                menu.style.maxHeight = "none";
                menu.style.height = "auto";
                menu.style.visibility = "hidden";
                menu.style.left = `${vx + VIEWPORT_PAD}px`;
                menu.style.top = `${vy + VIEWPORT_PAD}px`;

                const naturalHeight = Math.max(1, menu.scrollHeight + 2);

                const viewTop = vy + VIEWPORT_PAD;
                const viewBottom = vy + vh - VIEWPORT_PAD;
                const viewLeft = vx + VIEWPORT_PAD;
                const viewRight = vx + vw - VIEWPORT_PAD;
                const availableViewportHeight = Math.max(1, viewBottom - viewTop);

                let belowStart, aboveEnd, preferredLeftFor;

                if (contextPoint) {
                    belowStart = contextPoint.y + GAP;
                    aboveEnd = contextPoint.y - GAP;
                    preferredLeftFor = (side) => {
                        const rightLeft = contextPoint.x + GAP;
                        const leftLeft = contextPoint.x - menuWidth - GAP;
                        if (rightLeft + menuWidth <= viewRight) return { left: rightLeft, origin: side === "below" ? "top left" : "bottom left" };
                        if (leftLeft >= viewLeft) return { left: leftLeft, origin: side === "below" ? "top right" : "bottom right" };
                        return { left: rightLeft, origin: side === "below" ? "top left" : "bottom left" };
                    };
                } else if (anchorRect) {
                    belowStart = anchorRect.bottom + GAP;
                    aboveEnd = anchorRect.top - GAP;
                    preferredLeftFor = (side) => {
                        const rightLeft = anchorRect.right - menuWidth;
                        const leftLeft = anchorRect.left;
                        if (rightLeft >= viewLeft) return { left: rightLeft, origin: side === "below" ? "top right" : "bottom right" };
                        if (leftLeft + menuWidth <= viewRight) return { left: leftLeft, origin: side === "below" ? "top left" : "bottom left" };
                        return { left: rightLeft, origin: side === "below" ? "top right" : "bottom right" };
                    };
                } else {
                    belowStart = viewTop + (availableViewportHeight - naturalHeight) / 2;
                    aboveEnd = belowStart + naturalHeight;
                    preferredLeftFor = () => ({ left: viewLeft + (viewRight - viewLeft - menuWidth) / 2, origin: "center" });
                }

                const spaceBelow = Math.max(0, viewBottom - belowStart);
                const spaceAbove = Math.max(0, aboveEnd - viewTop);

                let side;
                if (placement === "top") {
                    side = spaceAbove >= naturalHeight || spaceAbove >= spaceBelow ? "above" : "below";
                } else if (placement === "bottom") {
                    side = spaceBelow >= naturalHeight || spaceBelow >= spaceAbove ? "below" : "above";
                } else if (spaceBelow >= naturalHeight) {
                    side = "below";
                } else if (spaceAbove >= naturalHeight) {
                    side = "above";
                } else {
                    side = spaceBelow >= spaceAbove ? "below" : "above";
                }

                const availableForSide = side === "below" ? spaceBelow : spaceAbove;
                const maxHeight = Math.min(naturalHeight, Math.max(1, availableForSide));

                let top;
                if (side === "below") {
                    top = belowStart;
                } else {
                    top = aboveEnd - maxHeight;
                }
                top = clamp(top, viewTop, Math.max(viewTop, viewBottom - maxHeight));

                const { left: rawLeft, origin } = preferredLeftFor(side);
                const left = clamp(rawLeft, viewLeft, Math.max(viewLeft, viewRight - menuWidth));

                setPosition({ left, top, width: menuWidth, maxHeight, origin });
                menu.style.visibility = "visible";
            } catch (err) {
                console.error("[ActionMenu] failed to position menu, falling back to center:", err);
                const { width: vw, height: vh, offsetLeft: vx, offsetTop: vy } = getViewport();
                const menuWidth = Math.min(width, Math.max(1, vw - VIEWPORT_PAD * 2));
                setPosition({
                    left: vx + (vw - menuWidth) / 2,
                    top: vy + VIEWPORT_PAD,
                    width: menuWidth,
                    maxHeight: Math.max(1, vh - VIEWPORT_PAD * 2),
                    origin: "center",
                });
                menu.style.visibility = "visible";
            }
        };

        updatePosition();

        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition, true);
        window.visualViewport?.addEventListener("resize", updatePosition);
        window.visualViewport?.addEventListener("scroll", updatePosition);

        return () => {
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition, true);
            window.visualViewport?.removeEventListener("resize", updatePosition);
            window.visualViewport?.removeEventListener("scroll", updatePosition);
        };
    }, [
        anchorRect?.top,
        anchorRect?.bottom,
        anchorRect?.left,
        anchorRect?.right,
        point?.x,
        point?.y,
        width,
        items.length,
        placement,
    ]);

    useEffect(() => {
        const onPointerDown = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) requestClose();
        };
        const onKeyDown = (event) => {
            if (event.key === "Escape") requestClose();
        };

        document.addEventListener("pointerdown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [onClose, closing]);

    const visibleItems = items.filter(Boolean);
    const isScrollable = position?.maxHeight != null && menuRef.current
        ? menuRef.current.scrollHeight - 1 > position.maxHeight
        : false;

    return createPortal(
        <div
            ref={menuRef}
            role="menu"
            className={`fixed z-[100] overflow-x-hidden overflow-y-auto rounded-2xl py-1.5 ${isScrollable ? "action-menu-scrollable" : ""} ${className}`}
            style={{
                left: position?.left ?? VIEWPORT_PAD,
                top: position?.top ?? VIEWPORT_PAD,
                width: position?.width ?? Math.min(width, Math.max(1, window.innerWidth - VIEWPORT_PAD * 2)),
                maxHeight: position?.maxHeight ?? `calc(100dvh - ${VIEWPORT_PAD * 2}px)`,
                visibility: position ? "visible" : "hidden",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-lg)",
                transformOrigin: position?.origin || "top right",
                animation: `${closing ? "action-menu-out" : "action-menu-in"} ${ANIMATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1) both`,
                overscrollBehavior: "contain",
            }}
        >
            {visibleItems.map((item, index) => {
                if (item.separator) {
                    return <div key={`separator-${index}`} className="my-1.5 h-px" style={{ background: "var(--border)" }} />;
                }

                const Icon = item.icon;
                const danger = item.danger;
                const disabled = item.disabled;

                return (
                    <button
                        key={item.key || `${item.label}-${index}`}
                        type="button"
                        role="menuitem"
                        disabled={disabled}
                        onClick={() => {
                            if (disabled) return;
                            item.onClick?.();
                            requestClose();
                        }}
                        className="group flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-[13.5px] transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                        style={{ color: danger ? "var(--danger)" : "var(--text)" }}
                    >
                        {Icon && (
                            <span
                                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-colors"
                                style={{
                                    background: danger
                                        ? "color-mix(in srgb, var(--danger) 10%, transparent)"
                                        : "color-mix(in srgb, var(--text) 5%, transparent)",
                                }}
                            >
                                <Icon size={15.5} strokeWidth={2} />
                            </span>
                        )}
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        {item.shortcut && <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>{item.shortcut}</span>}
                    </button>
                );
            })}
        </div>,
        document.body
    );
}
