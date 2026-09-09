export default function Toggle({ checked, onChange }) {
    return (
        <button
            onClick={() => onChange(!checked)}
            className="relative h-6 w-10 shrink-0 rounded-full transition-colors duration-200"
            style={{ background: checked ? "var(--accent)" : "var(--surface-hover)" }}
            aria-pressed={checked}
        >
            <span
                className="absolute top-0.5 left-0 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200"
                style={{ transform: checked ? "translateX(18px)" : "translateX(2px)" }}
            />
        </button>
    );
}
