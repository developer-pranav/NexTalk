export default function TypingIndicator() {
    return (
        <div className="flex justify-start anim-bubble-in">
            <div
                className="flex items-center gap-1 px-4 py-3"
                style={{
                    background: "var(--bubble-received)",
                    border: "1px solid var(--bubble-received-border)",
                    borderRadius: "16px 16px 16px 4px",
                }}
            >
                {[0, 1, 2].map((i) => (
                    <span
                        key={i}
                        className="anim-typing-dot h-1.5 w-1.5 rounded-full"
                        style={{ background: "var(--text-faint)", animationDelay: `${i * 0.15}s` }}
                    />
                ))}
            </div>
        </div>
    );
}
