import { MessageCircle } from "lucide-react";

export default function AuthLayout({ eyebrow, title, subtitle, children, footer }) {
    return (
        <main className="auth-page">
            <section className="auth-card">
                <div className="auth-card-header">
                    <div className="mb-5 flex items-center gap-2.5">
                        <div
                            className="grid h-9 w-9 place-items-center rounded-xl"
                            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                        >
                            <MessageCircle size={18} strokeWidth={2.2} />
                        </div>
                        <span className="text-[14px] font-semibold" style={{ color: "var(--text)" }}>
                            TalkVerse
                        </span>
                    </div>

                    <p className="text-[12.5px] font-medium" style={{ color: "var(--accent)" }}>
                        {eyebrow}
                    </p>
                    <h1 className="mt-1.5 text-[29px] font-semibold tracking-[-0.03em]" style={{ color: "var(--text)" }}>
                        {title}
                    </h1>
                    <p className="mt-1.5 text-[13.5px] leading-5" style={{ color: "var(--text-muted)" }}>
                        {subtitle}
                    </p>
                </div>

                <div className="auth-card-body">{children}</div>
                {footer}
            </section>
        </main>
    );
}
