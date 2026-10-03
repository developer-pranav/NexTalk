import { ArrowLeft, Mail } from "lucide-react";
import { useState } from "react";
import AuthLayout from "../../components/auth/AuthLayout";
import { AuthField } from "../../components/auth/AuthInput";
import { requestPasswordReset } from "../../api/users";
import { useToast } from "../../context/ToastContext";
import { AUTH_ROUTES, navigate } from "../../router/router";

export default function ForgotPasswordPage() {
    const { showToast } = useToast();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const submit = async (event) => {
        event.preventDefault();

        const value = email.trim().toLowerCase();

        if (!value) {
            showToast("Enter your email address to continue.", {
                type: "error",
                title: "Missing email",
            });
            return;
        }

        setLoading(true);

        try {
            await requestPasswordReset(value);
            setSent(true);
        } catch (error) {
            showToast(
                error?.response?.data?.message ||
                    "Couldn't send the reset link. Please try again.",
                { type: "error" }
            );
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <AuthLayout
                eyebrow="Check your inbox"
                title="Reset link sent"
                subtitle="If an account exists for that email, you'll receive a password reset link shortly."
            >
                <div className="space-y-4">
                    <div
                        className="rounded-2xl px-4 py-3.5 text-[13px] leading-5"
                        style={{
                            background: "var(--surface-hover)",
                            color: "var(--text-muted)",
                        }}
                    >
                        The reset link is valid for 15 minutes. Check your spam or promotions folder if you don't see it.
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate(AUTH_ROUTES.LOGIN, { replace: true })}
                        className="auth-submit cursor-pointer"
                    >
                        Back to sign in
                    </button>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            eyebrow="Account recovery"
            title="Forgot your password?"
            subtitle="Enter your email and we'll send you a secure reset link."
        >
            <form onSubmit={submit} className="space-y-4">
                <AuthField
                    label="Email"
                    icon={Mail}
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    autoFocus
                />

                <button
                    className="auth-submit cursor-pointer"
                    type="submit"
                    disabled={loading}
                >
                    {loading ? "Sending…" : "Send reset link"}
                </button>

                <button
                    type="button"
                    onClick={() => navigate(AUTH_ROUTES.LOGIN)}
                    className="flex w-full items-center justify-center gap-1.5 pt-1 text-[12.5px] font-medium hover:opacity-80"
                    style={{ color: "var(--text-muted)" }}
                >
                    <ArrowLeft size={14} />
                    Back to sign in
                </button>
            </form>
        </AuthLayout>
    );
}
