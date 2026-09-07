import { useEffect, useState } from "react";

const QUERIES = {
    mobile: "(max-width: 767px)",
    tablet: "(min-width: 768px) and (max-width: 1023px)",
    desktop: "(min-width: 1024px)",
};

function resolve() {
    if (typeof window === "undefined") return "desktop";
    if (window.matchMedia(QUERIES.mobile).matches) return "mobile";
    if (window.matchMedia(QUERIES.tablet).matches) return "tablet";
    return "desktop";
}

/** Returns "mobile" | "tablet" | "desktop", updated live on resize. */
export function useBreakpoint() {
    const [breakpoint, setBreakpoint] = useState(resolve);

    useEffect(() => {
        const mqs = Object.values(QUERIES).map((q) => window.matchMedia(q));
        const handler = () => setBreakpoint(resolve());
        mqs.forEach((mq) => mq.addEventListener("change", handler));
        return () => mqs.forEach((mq) => mq.removeEventListener("change", handler));
    }, []);

    return breakpoint;
}
