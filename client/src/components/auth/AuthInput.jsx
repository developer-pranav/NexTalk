import { Eye, EyeOff } from "lucide-react";

export function AuthField({ label, icon: Icon, className = "", ...props }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-medium" style={{ color: "var(--text)" }}>
                {label}
            </span>
            <div className="relative">
                {Icon && (
                    <Icon
                        size={17}
                        className="absolute left-4 top-1/2 -translate-y-1/2"
                        style={{ color: "var(--text-faint)" }}
                    />
                )}
                <input {...props} className={`auth-input ${Icon ? "auth-input-icon" : ""} ${className}`} />
            </div>
        </label>
    );
}

export function PasswordField({ label, show, setShow, ...props }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-medium" style={{ color: "var(--text)" }}>
                {label}
            </span>
            <div className="relative">
                <input {...props} type={show ? "text" : "password"} className="auth-input auth-input-password" />
                <button
                    type="button"
                    onClick={() => setShow((value) => !value)}
                    className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg hover:bg-[var(--surface-hover)]"
                    style={{ color: "var(--text-muted)" }}
                    aria-label={show ? "Hide password" : "Show password"}
                >
                    {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
            </div>
        </label>
    );
}
