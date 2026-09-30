import { Mail, User, UserRound } from "lucide-react";
import { useState } from "react";
import AuthLayout from "../../components/auth/AuthLayout";
import { AuthField, PasswordField } from "../../components/auth/AuthInput";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { navigate, AUTH_ROUTES } from "../../router/router";

function friendlyRegisterError(error) {
    const status = error?.response?.status;
    const message = (error?.response?.data?.message || "").toLowerCase();

    if (status === 409) {
        if (message.includes("email")) return { title: "Email already registered", message: "That email is already linked to a NexTalk account." };
        if (message.includes("username")) return { title: "Username already taken", message: "Try a different username — this one is already in use." };
        return { title: "Account already exists", message: "Those details are already registered. Try signing in instead." };
    }
    if (status === 400) return { title: "Check your details", message: "Please fill in all required fields correctly." };
    if (status >= 500) return { title: "Server problem", message: "NexTalk is having trouble right now. Please try again in a moment." };
    if (!error?.response) return { title: "Can't reach NexTalk", message: "Check that the server is running and try again." };
    return { title: "Couldn't create account", message: error?.response?.data?.message || "Please check your details and try again." };
}

export default function RegisterPage() {
    const { register } = useAuth();
    const { showToast } = useToast();
    const [form, setForm] = useState({ fullname: "", username: "", email: "", gender: "", password: "", confirmPassword: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);

    const update = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const submit = async (event) => {
        event.preventDefault();
        const fullname = form.fullname.trim();
        const username = form.username.trim().replace(/^@/, "");
        const email = form.email.trim();

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
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            eyebrow="Get started"
            title="Create your account"
            subtitle="Join NexTalk and start connecting."
        >
            <form onSubmit={submit} className="space-y-3.5">
                <AuthField label="Full name" icon={UserRound} name="fullname" value={form.fullname} onChange={update} placeholder="Your name" autoComplete="name" />
                <AuthField label="Username" icon={User} name="username" value={form.username} onChange={update} placeholder="@username" autoComplete="username" />
                <AuthField label="Email" icon={Mail} name="email" value={form.email} onChange={update} placeholder="you@example.com" autoComplete="email" />
                <div className="space-y-2">
                    <label
                        className="text-[12px] font-medium"
                        style={{ color: "var(--text-muted)" }}
                    >
                        Gender
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { value: "male", label: "Male" },
                            { value: "female", label: "Female" },
                        ].map((option) => {
                            const selected = form.gender === option.value;
                            const isMale = option.value === "male";

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() =>
                                        setForm((prev) => ({
                                            ...prev,
                                            gender: option.value,
                                        }))
                                    }
                                    className="rounded-xl px-3 py-2.5 text-sm font-medium transition cursor-pointer"
                                    style={{
                                        color: selected
                                            ? isMale
                                                ? "#60a5fa"
                                                : "#f472b6"
                                            : "var(--text-muted)",

                                        background: selected
                                            ? isMale
                                                ? "rgba(59, 130, 246, 0.10)"
                                                : "rgba(236, 72, 153, 0.10)"
                                            : "transparent",

                                        border: `1px solid ${selected
                                                ? isMale
                                                    ? "#3b82f6"
                                                    : "#ec4899"
                                                : "var(--border)"
                                            }`,
                                    }}
                                >
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <PasswordField label="Password" name="password" value={form.password} onChange={update} placeholder="Create a password" autoComplete="new-password" show={showPassword} setShow={setShowPassword} />
                <PasswordField label="Confirm password" name="confirmPassword" value={form.confirmPassword} onChange={update} placeholder="Repeat your password" autoComplete="new-password" show={showConfirm} setShow={setShowConfirm} />

                <button className="auth-submit !mt-5 cursor-pointer" type="submit" disabled={loading}>
                    {loading ? "Creating account…" : "Create account"}
                </button>

                <p className="pt-1 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
                    Already have an account?{" "}
                    <button type="button" onClick={() => navigate(AUTH_ROUTES.LOGIN)} className="font-semibold hover:opacity-80" style={{ color: "var(--accent)" }}>
                        Sign in
                    </button>
                </p>
            </form>
        </AuthLayout>
    );
}
