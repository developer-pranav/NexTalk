import { useEffect } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { ChatProvider } from "./context/ChatContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import { AUTH_ROUTES, navigate, usePathname } from "./router/router";
import { useBreakpoint } from "./hooks/useBreakpoint";
import DesktopLayout from "./layouts/DesktopLayout";
import TabletLayout from "./layouts/TabletLayout";
import MobileLayout from "./layouts/MobileLayout";

function AuthenticatedApp() {
    const { isAuthenticated, loading } = useAuth();
    const pathname = usePathname();

    useEffect(() => {
        if (loading) return;
        const isAppRoute = pathname === AUTH_ROUTES.HOME || pathname === "/search" || pathname === "/requests";
        if (isAuthenticated && !isAppRoute) {
            navigate(AUTH_ROUTES.HOME, { replace: true });
            return;
        }
        if (!isAuthenticated && pathname !== AUTH_ROUTES.LOGIN && pathname !== AUTH_ROUTES.REGISTER) {
            navigate(AUTH_ROUTES.LOGIN, { replace: true });
        }
    }, [isAuthenticated, loading, pathname]);

    if (loading) {
        return <div className="grid h-full w-full place-items-center" style={{ background: "var(--bg)", color: "var(--text-muted)" }}>Loading…</div>;
    }

    if (isAuthenticated) {
        return <Shell />;
    }

    if (pathname === AUTH_ROUTES.REGISTER) return <RegisterPage />;
    return <LoginPage />;
}

function Shell() {
    const breakpoint = useBreakpoint();

    return (
        <div className="h-full w-full overflow-hidden">
            {breakpoint === "mobile" && <MobileLayout />}
            {breakpoint === "tablet" && <TabletLayout />}
            {breakpoint === "desktop" && <DesktopLayout />}
        </div>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <ToastProvider>
                <AuthProvider>
                    <ChatProvider>
                        <AuthenticatedApp />
                    </ChatProvider>
                </AuthProvider>
            </ToastProvider>
        </ThemeProvider>
    );
}
