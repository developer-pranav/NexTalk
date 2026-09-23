import { useEffect, useState } from "react";

export const AUTH_ROUTES = {
    LOGIN: "/login",
    REGISTER: "/register",
    HOME: "/",
};

export function navigate(path, { replace = false } = {}) {
    const next = path || AUTH_ROUTES.HOME;
    if (replace) window.history.replaceState({}, "", next);
    else window.history.pushState({}, "", next);
    window.dispatchEvent(new PopStateEvent("popstate"));
}

export function usePathname() {
    const [pathname, setPathname] = useState(window.location.pathname);

    useEffect(() => {
        const handlePopState = () => setPathname(window.location.pathname);
        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    return pathname;
}
