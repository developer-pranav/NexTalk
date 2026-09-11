import {
    Eye,
    EyeOff,
    Lock,
    Mail,
    User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Toast from "./Toast";

const initialSignup = {
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
};

const initialLogin = {
    usernameEmail: "",
    password: "",
};

export default function LoginPage() {
    const { register, login } = useAuth();
    const [mode, setMode] = useState("login");
    const [signupForm, setSignupForm] = useState(initialSignup);
    const [loginForm, setLoginForm] = useState(initialLogin);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState("");
    const [toastType, setToastType] = useState("default");

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(""), 3000);
        return () => clearTimeout(timer);
    }, [toast]);

    const notify = (message, type = "default") => {
        setToastType(type);
        setToast(message);
    };

    const switchMode = (nextMode) => {
        setMode(nextMode);
        setToast("");
        setShowPassword(false);
        setShowConfirmPassword(false);
    };

    const handleSignupChange = (e) => {
        setSignupForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
        setToast("");
    };

    const handleLoginChange = (e) => {
        setLoginForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
        setToast("");
    };

    const getErrorMessage = (err, fallback) =>
        err?.response?.data?.message || err?.message || fallback;

    const handleSignup = async (e) => {
        e.preventDefault();
        setToast("");

        const name = signupForm.name.trim();
        const username = signupForm.username.trim().replace(/^@/, "");
        const email = signupForm.email.trim();

        if (!name || !username || !email || !signupForm.password || !signupForm.confirmPassword) {
            notify("Please fill in all fields.", "error");
            return;
        }

        if (signupForm.password !== signupForm.confirmPassword) {
            notify("Passwords do not match.", "error");
            return;
        }

        setLoading(true);
        try {
            await register({
                username,
                fullname: name,
                email,
                password: signupForm.password,
            });

            // Registration already authenticates the user on the server.
            // AuthContext sets the returned user, so App immediately opens Home.
            setSignupForm(initialSignup);
        } catch (err) {
            notify(
                err?.response?.status === 409
                    ? getErrorMessage(err, "Account details already exist.")
                    : getErrorMessage(err, "Unable to create your account."),
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setToast("");

        const usernameEmail = loginForm.usernameEmail.trim();
        if (!usernameEmail || !loginForm.password) {
            notify("Please enter your username/email and password.", "error");
            return;
        }

        setLoading(true);
        try {
            await login({
                usernameEmail,
                password: loginForm.password,
            });
        } catch (err) {
            notify(getErrorMessage(err, "Invalid username/email or password."), "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen w-full flex items-center justify-center px-4 py-6"
            style={{ background: "var(--bg)" }}
        >
            <div
                className="w-full max-w-[520px] rounded-[28px] border overflow-hidden"
                style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                    boxShadow: "var(--shadow-lg)",
                }}
            >
                <div className="px-8 pt-7 pb-5">
                    <p
                        className="text-[13px] font-medium mb-1"
                        style={{ color: "var(--accent)" }}
                    >
                        {mode === "signup" ? "Get started" : "Welcome back"}
                    </p>

                    <h1
                        className="text-[28px] sm:text-[32px] font-semibold tracking-tight"
                        style={{ color: "var(--text)" }}
                    >
                        {mode === "signup" ? "Create your account" : "Sign in to TalkVerse"}
                    </h1>

                    <p
                        className="mt-1.5 text-[14px]"
                        style={{ color: "var(--text-muted)" }}
                    >
                        {mode === "signup"
                            ? "Join TalkVerse and start connecting."
                            : "Continue your conversations where you left off."}
                    </p>
                </div>

                {mode === "signup" ? (
                    <form onSubmit={handleSignup} className="px-8 pb-8 space-y-3.5">
                        <FieldLabel>Full name</FieldLabel>
                        <div className="relative">
                            <User
                                size={17}
                                className="absolute left-4 top-1/2 -translate-y-1/2"
                                style={{ color: "var(--text-muted)" }}
                            />
                            <input
                                type="text"
                                name="name"
                                value={signupForm.name}
                                onChange={handleSignupChange}
                                placeholder="Your name"
                                autoComplete="name"
                                className="auth-input auth-input-icon"
                            />
                        </div>

                        <FieldLabel>Username</FieldLabel>
                        <input
                            type="text"
                            name="username"
                            value={signupForm.username}
                            onChange={handleSignupChange}
                            placeholder="@username"
                            autoComplete="username"
                            className="auth-input"
                        />

                        <FieldLabel>Email</FieldLabel>
                        <div className="relative">
                            <Mail
                                size={17}
                                className="absolute left-4 top-1/2 -translate-y-1/2"
                                style={{ color: "var(--text-muted)" }}
                            />
                            <input
                                type="email"
                                name="email"
                                value={signupForm.email}
                                onChange={handleSignupChange}
                                placeholder="you@example.com"
                                autoComplete="email"
                                className="auth-input auth-input-icon"
                            />
                        </div>

                        <FieldLabel>Password</FieldLabel>
                        <PasswordInput
                            name="password"
                            value={signupForm.password}
                            onChange={handleSignupChange}
                            placeholder="Create a password"
                            show={showPassword}
                            setShow={setShowPassword}
                            autoComplete="new-password"
                        />

                        <FieldLabel>Confirm password</FieldLabel>
                        <PasswordInput
                            name="confirmPassword"
                            value={signupForm.confirmPassword}
                            onChange={handleSignupChange}
                            placeholder="Repeat your password"
                            show={showConfirmPassword}
                            setShow={setShowConfirmPassword}
                            autoComplete="new-password"
                        />

                        <button type="submit" disabled={loading} className="auth-submit">
                            {loading ? "Creating account…" : "Create account"}
                        </button>

                        <p className="text-center text-[13px] pt-1" style={{ color: "var(--text-muted)" }}>
                            Already have an account?{" "}
                            <button
                                type="button"
                                onClick={() => switchMode("login")}
                                className="font-semibold hover:opacity-80"
                                style={{ color: "var(--accent)" }}
                            >
                                Sign in
                            </button>
                        </p>
                    </form>
                ) : (
                    <form onSubmit={handleLogin} className="px-8 pb-8 space-y-4">
                        <div>
                            <label className="mb-1.5 block text-[13px] font-medium" style={{ color: "var(--text)" }}>
                                Username or email
                            </label>
                            <div className="relative">
                                <User
                                    size={17}
                                    className="absolute left-4 top-1/2 -translate-y-1/2"
                                    style={{ color: "var(--text-muted)" }}
                                />
                                <input
                                    type="text"
                                    name="usernameEmail"
                                    value={loginForm.usernameEmail}
                                    onChange={handleLoginChange}
                                    placeholder="@username or email"
                                    autoComplete="username"
                                    className="auth-input auth-input-icon"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-[13px] font-medium" style={{ color: "var(--text)" }}>
                                Password
                            </label>
                            <PasswordInput
                                name="password"
                                value={loginForm.password}
                                onChange={handleLoginChange}
                                placeholder="Your password"
                                show={showPassword}
                                setShow={setShowPassword}
                                autoComplete="current-password"
                            />
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => notify("Password reset will be available soon.")}
                                className="text-[12px] font-medium hover:opacity-80"
                                style={{ color: "var(--accent)" }}
                            >
                                Forgot password?
                            </button>
                        </div>

                        <button type="submit" disabled={loading} className="auth-submit">
                            {loading ? "Signing in…" : "Sign in"}
                        </button>

                        <div className="flex items-center gap-3 py-1">
                            <div className="h-px flex-1" style={{ background: "var(--border)" }} />
                            <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>OR</span>
                            <div className="h-px flex-1" style={{ background: "var(--border)" }} />
                        </div>

                        <button
                            type="button"
                            onClick={() => notify("Google sign-in is not connected yet.")}
                            className="h-[50px] w-full rounded-xl border text-[14px] font-medium transition-opacity hover:opacity-80"
                            style={{
                                borderColor: "var(--border)",
                                background: "var(--bg)",
                                color: "var(--text)",
                            }}
                        >
                            Continue with Google
                        </button>

                        <p className="text-center text-[13px] pt-1" style={{ color: "var(--text-muted)" }}>
                            New to TalkVerse?{" "}
                            <button
                                type="button"
                                onClick={() => switchMode("signup")}
                                className="font-semibold hover:opacity-80"
                                style={{ color: "var(--accent)" }}
                            >
                                Create account
                            </button>
                        </p>
                    </form>
                )}
            </div>
            <Toast message={toast} position="top-right" type={toastType} />
        </div>
    );
}

function FieldLabel({ children }) {
    return (
        <label
            className="block text-[13px] font-medium -mb-2"
            style={{ color: "var(--text)" }}
        >
            {children}
        </label>
    );
}

function PasswordInput({ name, value, onChange, placeholder, show, setShow, autoComplete }) {
    return (
        <div className="relative">
            <Lock
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}
            />
            <input
                type={show ? "text" : "password"}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                autoComplete={autoComplete}
                className="auth-input auth-input-icon auth-input-password"
            />
            <button
                type="button"
                onClick={() => setShow((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center"
                style={{ color: "var(--text-muted)" }}
                aria-label={show ? "Hide password" : "Show password"}
            >
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
        </div>
    );
}
