import { Mail, User, UserRound, Check, X, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AuthLayout from "../../components/auth/AuthLayout";
import { AuthField, PasswordField } from "../../components/auth/AuthInput";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { checkUsernameAvailability } from "../../api/users";
import { navigate, AUTH_ROUTES } from "../../router/router";

function friendlyRegisterError(error) {
    const status = error?.response?.status;
    const message = (error?.response?.data?.message || "").toLowerCase();

    if (status === 409) {
        if (message.includes("email")) return { title: "Email already registered", message: "That email is already linked to a NexTalk account." };
        if (message.includes("username")) return { title: "Username already taken", message: "Try one of the suggested usernames below." };
        return { title: "Account already exists", message: "Those details are already registered. Try signing in instead." };
    }
    if (status === 400) return { title: "Check your details", message: "Please fill in all required fields correctly." };
    if (status === 401) return { title: "Google session expired", message: "Please start Google sign-in again." };
    if (status >= 500) return { title: "Server problem", message: "NexTalk is having trouble right now. Please try again in a moment." };
    if (!error?.response) return { title: "Can't reach NexTalk", message: "Check that the server is running and try again." };
    return { title: "Couldn't create account", message: error?.response?.data?.message || "Please check your details and try again." };
}

function decodeGoogleToken(token) {
    try {
        const payload = token.split(".")[1];
        const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
        const json = decodeURIComponent(
            atob(normalized)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );
        return JSON.parse(json);
    } catch {
        return {};
    }
}

function cleanUsername(value) {
    return value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
}

function buildSuggestions(fullname, email, current) {
    const nameParts = fullname.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const first = nameParts[0] || "user";
    const last = nameParts[nameParts.length - 1] || "";
    const emailName = (email.split("@")[0] || "user").toLowerCase();
    const base = cleanUsername(current) || cleanUsername(first + last) || cleanUsername(emailName) || "user";
    const raw = [
        base,
        cleanUsername(first + last),
        cleanUsername(first + last + "19"),
        cleanUsername(first + "_" + last),
        cleanUsername(emailName),
        cleanUsername(first + "dev"),
        cleanUsername(first + "_" + emailName),
        cleanUsername(base + "01"),
        cleanUsername(base + "07"),
    ];
    return [...new Set(raw)].filter((x) => x.length >= 3).slice(0, 5);
}

export default function RegisterPage() {
    const { register, googleRegister } = useAuth();
    const { showToast } = useToast();
    const [googleMode, setGoogleMode] = useState(false);
    const [googleToken, setGoogleToken] = useState("");
    const [googleAvatar, setGoogleAvatar] = useState("");
    const [usernameState, setUsernameState] = useState("idle");
    const [usernameMessage, setUsernameMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ fullname: "", username: "", email: "", gender: "", password: "", confirmPassword: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("googleToken");
        if (!token) return;
        const googleData = decodeGoogleToken(token);
        setGoogleMode(true);
        setGoogleToken(token);
        setGoogleAvatar(googleData.avatar || "");
        setForm((prev) => ({ ...prev, fullname: googleData.fullname || params.get("fullname") || "", email: googleData.email || params.get("email") || "" }));
    }, []);

    const update = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: name === "username" ? cleanUsername(value) : value }));
        if (name === "username") {
            setUsernameState("idle");
            setUsernameMessage("");
        }
    };

    useEffect(() => {
        if (!googleMode) return;
        const username = form.username.trim();
        if (username.length < 3) {
            setUsernameState(username.length ? "invalid" : "idle");
            setUsernameMessage(username.length ? "At least 3 characters" : "");
            return;
        }
        let cancelled = false;
        const timer = window.setTimeout(async () => {
            setUsernameState("checking");
            try {
                const response = await checkUsernameAvailability(username);
                const available = response?.data?.available ?? response?.available;
                if (cancelled) return;
                setUsernameState(available ? "available" : "taken");
                setUsernameMessage(available ? "Username available" : "Username already taken");
            } catch {
                if (!cancelled) {
                    setUsernameState("error");
                    setUsernameMessage("Couldn't check username");
                }
            }
        }, 450);
        return () => { cancelled = true; window.clearTimeout(timer); };
    }, [form.username, googleMode]);

    const suggestions = useMemo(() => buildSuggestions(form.fullname, form.email, form.username), [form.fullname, form.email, form.username]);

    const startGoogleLogin = () => {
        const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
        if (!apiUrl) {
            showToast("API URL is not configured.", { type: "error", title: "Configuration error" });
            return;
        }
        window.location.href = `${apiUrl}/users/google`;
    };

    const submit = async (event) => {
        event.preventDefault();
        const fullname = form.fullname.trim();
        const username = form.username.trim();
        const email = form.email.trim();

        if (googleMode) {
            if (!googleToken || !username || !form.gender) {
                showToast("Choose a username and gender to finish your Google account.", { type: "error", title: "Missing details" });
                return;
            }
            if (usernameState === "taken" || usernameState === "invalid" || usernameState === "checking") {
                showToast(usernameState === "taken" ? "Choose an available username." : "Please wait until the username is available.", { type: "error", title: "Username unavailable" });
                return;
            }
            setLoading(true);
            try {
                await googleRegister({ googleToken, username, gender: form.gender });
                window.history.replaceState({}, "", AUTH_ROUTES.REGISTER);
                showToast("Your account is ready. Welcome to NexTalk!", { type: "success", title: "Account created", duration: 2200 });
                navigate(AUTH_ROUTES.HOME, { replace: true });
            } catch (error) {
                const friendly = friendlyRegisterError(error);
                showToast(friendly.message, { type: "error", title: friendly.title });
                if (error?.response?.status === 409 && String(error?.response?.data?.message || "").toLowerCase().includes("username")) setUsernameState("taken");
            } finally { setLoading(false); }
            return;
        }

        if (!fullname || !username || !email || !form.gender || !form.password || !form.confirmPassword) {
            showToast("Fill in all the required fields to create your account.", { type: "error", title: "Missing details" });
            return;
        }
        if (form.password !== form.confirmPassword) {
            showToast("The two passwords don't match. Please check them and try again.", { type: "error", title: "Passwords don't match" });
            return;
        }
        setLoading(true);
        try {
            await register({ username, fullname, email, gender: form.gender, password: form.password });
            showToast("Your account is ready. Welcome to NexTalk!", { type: "success", title: "Account created", duration: 2200 });
            navigate(AUTH_ROUTES.HOME, { replace: true });
        } catch (error) {
            const friendly = friendlyRegisterError(error);
            showToast(friendly.message, { type: "error", title: friendly.title });
        } finally { setLoading(false); }
    };

    return (
        <AuthLayout
            eyebrow={googleMode ? "Almost there" : "Get started"}
            title={googleMode ? "Complete your NexTalk account" : "Create your account"}
            subtitle={googleMode ? "Choose a username and gender to finish signing up." : "Join NexTalk and start connecting."}
        >
            <form onSubmit={submit} className="space-y-3.5">
                {googleMode && googleAvatar && (
                    <div className="flex flex-col items-center pb-1">
                        <img src={googleAvatar} alt="Google profile" className="h-20 w-20 rounded-full object-cover border" style={{ borderColor: "var(--border)" }} />
                        <p className="mt-2 text-[11px]" style={{ color: "var(--text-muted)" }}>Google profile photo</p>
                    </div>
                )}

                <AuthField label="Full name" icon={UserRound} name="fullname" value={form.fullname} onChange={update} placeholder="Your name" autoComplete="name" disabled={googleMode} />
                <AuthField label="Username" icon={User} name="username" value={form.username} onChange={update} placeholder="username" autoComplete="username" autoFocus={googleMode} />

                {googleMode && form.username.length >= 3 && (
                    <div className="-mt-2 px-1">
                        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: usernameState === "available" ? "#22c55e" : usernameState === "taken" || usernameState === "invalid" ? "#ef4444" : "var(--text-muted)" }}>
                            {usernameState === "checking" && <Loader2 size={12} className="animate-spin" />}
                            {usernameState === "available" && <Check size={12} />}
                            {usernameState === "taken" && <X size={12} />}
                            <span>{usernameMessage || "Checking username…"}</span>
                        </div>
                        <p className="mt-2 mb-1 text-[11px]" style={{ color: "var(--text-muted)" }}>Suggestions</p>
                        <div className="flex flex-wrap gap-1.5">
                            {suggestions.map((suggestion) => (
                                <button key={suggestion} type="button" onClick={() => { setForm((prev) => ({ ...prev, username: suggestion })); setUsernameState("idle"); }} className="rounded-full border px-2.5 py-1 text-[11px] transition hover:bg-[var(--surface-hover)]" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>@{suggestion}</button>
                            ))}
                        </div>
                    </div>
                )}

                <AuthField label="Email" icon={Mail} name="email" value={form.email} onChange={update} placeholder="you@example.com" autoComplete="email" disabled={googleMode} />

                <div className="space-y-2">
                    <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Gender</label>
                    <div className="grid grid-cols-2 gap-2">
                        {[{ value: "male", label: "Male" }, { value: "female", label: "Female" }].map((option) => {
                            const selected = form.gender === option.value;
                            const isMale = option.value === "male";
                            return (
                                <button key={option.value} type="button" onClick={() => setForm((prev) => ({ ...prev, gender: option.value }))} className="cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium transition" style={{ color: selected ? (isMale ? "#60a5fa" : "#f472b6") : "var(--text-muted)", background: selected ? (isMale ? "rgba(59,130,246,.10)" : "rgba(236,72,153,.10)") : "transparent", border: `1px solid ${selected ? (isMale ? "#3b82f6" : "#ec4899") : "var(--border)"}` }}>{option.label}</button>
                            );
                        })}
                    </div>
                </div>

                {!googleMode && <>
                    <PasswordField label="Password" name="password" value={form.password} onChange={update} placeholder="Create a password" autoComplete="new-password" show={showPassword} setShow={setShowPassword} />
                    <PasswordField label="Confirm password" name="confirmPassword" value={form.confirmPassword} onChange={update} placeholder="Repeat your password" autoComplete="new-password" show={showConfirm} setShow={setShowConfirm} />
                </>}

                <button className="auth-submit !mt-5 cursor-pointer" type="submit" disabled={loading}>{loading ? "Creating account…" : googleMode ? "Complete account" : "Create account"}</button>

                {!googleMode && <>
                    <div className="flex items-center gap-3 py-1"><div className="h-px flex-1" style={{ background: "var(--border)" }} /><span className="text-[10px] font-medium" style={{ color: "var(--text-faint)" }}>OR</span><div className="h-px flex-1" style={{ background: "var(--border)" }} /></div>
                    <button type="button" onClick={startGoogleLogin} className="flex h-[50px] w-full items-center justify-center gap-3 rounded-xl border text-[13.5px] font-medium transition-colors hover:bg-[var(--surface-hover)]" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }}>
                        <img
                            src="https://www.gstatic.com/marketing-cms/assets/images/f2/8f/0c5ea5fe40d3975489b17df7f59d/googleg-gradient-standard-20dp.png"
                            alt="Google"
                            width="20"
                            height="20"
                            className="shrink-0"
                            draggable="false"
                        />
                        Continue with Google</button>
                </>}

                <p className="pt-1 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>Already have an account? <button type="button" onClick={() => navigate(AUTH_ROUTES.LOGIN)} className="font-semibold hover:opacity-80" style={{ color: "var(--accent)" }}>Sign in</button></p>
            </form>
        </AuthLayout>
    );
}
