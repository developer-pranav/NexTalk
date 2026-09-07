import { useEffect, useRef } from "react";

const MAX_PULL = 72;
const SPRING_BACK =
    "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)";

const rubberband = (distance, max) =>
    (distance * max) / (distance + max);

export function useRubberband(scrollRef, contentRef) {
    const stateRef = useRef({
        active: false,
        edge: null,
        edgeY: 0,
    });

    useEffect(() => {
        const scrollEl = scrollRef.current;
        const contentEl = contentRef.current;

        if (!scrollEl || !contentEl) return;

        const setOffset = (distance, animated = false) => {
            contentEl.style.transition = animated
                ? SPRING_BACK
                : "none";

            contentEl.style.transform =
                distance !== 0
                    ? `translate3d(0, ${distance}px, 0)`
                    : "";
        };

        const onTouchStart = (e) => {
            if (e.touches.length !== 1) return;

            stateRef.current = {
                active: true,
                edge: null,
                edgeY: e.touches[0].clientY,
            };

            setOffset(0, false);
        };

        const onTouchMove = (e) => {
            const state = stateRef.current;

            if (!state.active || e.touches.length !== 1) return;

            const y = e.touches[0].clientY;

            const maxScroll =
                Math.max(
                    0,
                    scrollEl.scrollHeight -
                    scrollEl.clientHeight
                );

            const atTop =
                scrollEl.scrollTop <= 0;

            const atBottom =
                scrollEl.scrollTop >= maxScroll - 1;

            if (state.edge === null && atTop) {
                if (y > state.edgeY) {
                    state.edge = "top";
                    state.edgeY = y;
                }
            }

            if (state.edge === null && atBottom) {
                if (y < state.edgeY) {
                    state.edge = "bottom";
                    state.edgeY = y;
                }
            }

            if (state.edge === "top") {
                const pull = y - state.edgeY;

                if (pull > 0) {
                    e.preventDefault();

                    setOffset(
                        rubberband(pull, MAX_PULL),
                        false
                    );
                }

                return;
            }

            if (state.edge === "bottom") {
                const pull = state.edgeY - y;

                if (pull > 0) {
                    e.preventDefault();

                    setOffset(
                        -rubberband(pull, MAX_PULL),
                        false
                    );
                }

                return;
            }

            state.edgeY = y;
        };

        const onTouchEnd = () => {
            const state = stateRef.current;

            if (state.edge !== null) {
                setOffset(0, true);
            }

            stateRef.current = {
                active: false,
                edge: null,
                edgeY: 0,
            };
        };

        scrollEl.addEventListener(
            "touchstart",
            onTouchStart,
            { passive: true }
        );

        scrollEl.addEventListener(
            "touchmove",
            onTouchMove,
            { passive: false }
        );

        scrollEl.addEventListener(
            "touchend",
            onTouchEnd,
            { passive: true }
        );

        scrollEl.addEventListener(
            "touchcancel",
            onTouchEnd,
            { passive: true }
        );

        return () => {
            scrollEl.removeEventListener(
                "touchstart",
                onTouchStart
            );

            scrollEl.removeEventListener(
                "touchmove",
                onTouchMove
            );

            scrollEl.removeEventListener(
                "touchend",
                onTouchEnd
            );

            scrollEl.removeEventListener(
                "touchcancel",
                onTouchEnd
            );
        };
    }, [scrollRef, contentRef]);
}