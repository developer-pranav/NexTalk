import { ArrowLeft } from "lucide-react";
import { useMemo, useState } from "react";
import AuthLayout from "../../components/auth/AuthLayout";
import { PasswordField } from "../../components/auth/AuthInput";
import { resetPassword } from "../../api/users";
import { useToast } from "../../context/ToastContext";
import { AUTH_ROUTES, navigate } from "../../router/router";

export default function ResetPasswordPage() {
    const { showToast } = useToast();
    const token = useMemo(
        () => new URLSearchParams(window.location.search).get("token") || "",
        []
    );

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const submit = async (event) => {
        event.preventDefault();

        if (!token) {
            showToast("This password reset link is invalid.", {
                type: "error",
                title: "Invalid link",
            });
            return;
        }

        if (password.length < 8) {
            showToast("Password must be at least 8 characters.", {
                type: "error",
                title: "Password too short",
            });
            return;
        }

        if (password !== confirmPassword) {
            showToast("Both password fields must match.", {
                type: "error",
                title: "Passwords don't match",
            });
            return;
        }

        setLoading(true);

        try {
            await resetPassword(token, password);
            showToast("Your password has been updated. You can sign in now.", {
                type: "success",
                title: "Password reset",
            });
            navigate(AUTH_ROUTES.LOGIN, { replace: true });
        } catch (error) {
            showToast(
                error?.response?.data?.message ||
                    "This reset link is invalid or expired.",
                { type: "error", title: "Reset failed" }
            );
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <AuthLayout
                eyebrow="Account recovery"
                title="Invalid reset link"
                subtitle="This password reset link is missing or invalid. Request a new one to continue."
            >
                <button
                    type="button"
                    onClick={() => navigate(AUTH_ROUTES.FORGOT_PASSWORD)}
                    className="auth-submit cursor-pointer"
                >
                    Request a new link
                </button>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            eyebrow="Account recovery"
            title="Create a new password"
            subtitle="Choose a new password for your NexTalk account."
        >
            <form onSubmit={submit} className="space-y-4">
                <PasswordField
                    label="New password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    show={showPassword}
                    setShow={setShowPassword}
                    autoFocus
                />

                <PasswordField
                    label="Confirm password"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Enter your new password again"
                    autoComplete="new-password"
                    show={showConfirmPassword}
                    setShow={setShowConfirmPassword}
                />

                <button
                    className="auth-submit cursor-pointer"
                    type="submit"
                    disabled={loading}
                >
                    {loading ? "Updating…" : "Reset password"}
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
