import { useEffect } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { ChatProvider } from "./context/ChatContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
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
        const isAppRoute = pathname === AUTH_ROUTES.HOME || pathname === AUTH_ROUTES.FORGOT_PASSWORD || pathname === AUTH_ROUTES.RESET_PASSWORD || pathname === "/search" || pathname === "/requests" || pathname === "/profile" || pathname === "/new-group" || pathname.startsWith("/chat/");
        if (isAuthenticated && !isAppRoute) {
            navigate(AUTH_ROUTES.HOME, { replace: true });
            return;
        }
        const isAuthRoute =
            pathname === AUTH_ROUTES.LOGIN ||
            pathname === AUTH_ROUTES.REGISTER ||
            pathname === AUTH_ROUTES.FORGOT_PASSWORD ||
            pathname === AUTH_ROUTES.RESET_PASSWORD;

        if (!isAuthenticated && !isAuthRoute) {
            navigate(AUTH_ROUTES.LOGIN, { replace: true });
        }
    }, [isAuthenticated, loading, pathname]);

    if (loading) {
        return <div className="grid h-full w-full place-items-center" style={{ background: "var(--bg)", color: "var(--text-muted)" }}>Loading…</div>;
    }

    if (pathname === AUTH_ROUTES.FORGOT_PASSWORD) {
        return <ForgotPasswordPage />;
    }

    if (pathname === AUTH_ROUTES.RESET_PASSWORD) {
        return <ResetPasswordPage />;
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
