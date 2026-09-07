export default function Toast({ message }) {
    if (!message) return null;
    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center">
            <div
                className="anim-pop-in rounded-full px-4 py-2 text-[12.5px] font-medium"
                style={{ background: "var(--text)", color: "var(--bg)", boxShadow: "var(--shadow-md)" }}
            >
                {message}
            </div>
        </div>
    );
}
