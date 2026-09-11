import { User } from "lucide-react";
import { useState } from "react";
import AuthLayout from "../../components/auth/AuthLayout";
import { AuthField, PasswordField } from "../../components/auth/AuthInput";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { navigate, AUTH_ROUTES } from "../../router/router";

function friendlyError(error, action) {
    const status = error?.response?.status;
    const message = error?.response?.data?.message || "";

    if (status === 400) return "Please enter your username/email and password.";
    if (status === 401) return "That username/email or password doesn't look right.";
    if (status === 429) return "Too many attempts. Please wait a moment and try again.";
    if (status >= 500) return "TalkVerse is having trouble right now. Please try again in a moment.";
    if (!error?.response) return "Couldn't connect to TalkVerse. Check that the server is running.";
    return message || `Couldn't ${action}. Please try again.`;
}

export default function LoginPage() {
    const { login } = useAuth();
    const { showToast } = useToast();
    const [form, setForm] = useState({ usernameEmail: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const submit = async (event) => {
        event.preventDefault();
        const usernameEmail = form.usernameEmail.trim();

        if (!usernameEmail || !form.password) {
            showToast("Enter your username/email and password to continue.", { type: "error", title: "Missing details" });
            return;
        }

        setLoading(true);
        try {
            await login({ usernameEmail, password: form.password });
            navigate(AUTH_ROUTES.HOME, { replace: true });
        } catch (error) {
            showToast(friendlyError(error, "sign you in"), { type: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            eyebrow="Welcome back"
            title="Sign in to TalkVerse"
            subtitle="Continue your conversations where you left off."
        >
            <form onSubmit={submit} className="space-y-4">
                <AuthField
                    label="Username or email"
                    icon={User}
                    name="usernameEmail"
                    value={form.usernameEmail}
                    onChange={(e) => setForm((prev) => ({ ...prev, usernameEmail: e.target.value }))}
                    placeholder="@username or email"
                    autoComplete="username"
                    autoFocus
                />

                <PasswordField
                    label="Password"
                    name="password"
                    value={form.password}
                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder="Your password"
                    autoComplete="current-password"
                    show={showPassword}
                    setShow={setShowPassword}
                />

                <div className="flex justify-end pt-0.5">
                    <button
                        type="button"
                        onClick={() => showToast("Password reset will be available soon.", { type: "info", title: "Coming soon" })}
                        className="text-[12px] font-medium hover:opacity-80"
                        style={{ color: "var(--accent)" }}
                    >
                        Forgot password?
                    </button>
                </div>

                <button className="auth-submit" type="submit" disabled={loading}>
                    {loading ? "Signing in…" : "Sign in"}
                </button>

                <div className="flex items-center gap-3 py-1">
                    <div className="h-px flex-1" style={{ background: "var(--border)" }} />
                    <span className="text-[10px] font-medium" style={{ color: "var(--text-faint)" }}>OR</span>
                    <div className="h-px flex-1" style={{ background: "var(--border)" }} />
                </div>

                <button
                    type="button"
                    onClick={() => showToast("Google sign-in isn't connected yet.", { type: "info", title: "Coming soon" })}
                    className="h-[50px] w-full rounded-xl border text-[13.5px] font-medium transition-colors hover:bg-[var(--surface-hover)]"
                    style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }}
                >
                    Continue with Google
                </button>

                <p className="pt-1 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
                    New to TalkVerse?{" "}
                    <button type="button" onClick={() => navigate(AUTH_ROUTES.REGISTER)} className="font-semibold hover:opacity-80" style={{ color: "var(--accent)" }}>
                        Create account
                    </button>
                </p>
            </form>
        </AuthLayout>
    );
}
