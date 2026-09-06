import { ChevronDown, ChevronUp, Search, X } from "lucide-react";

export default function ChatSearchBar({ query, onQueryChange, matchIndex, matchCount, onPrev, onNext, onClose }) {
  return (
    <div className="anim-pop-in mt-2 px-3 sm:px-5">
      <div
        className="mx-auto flex max-w-3xl items-center gap-2 rounded-2xl px-3 py-2"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
      >
        <Search size={15} style={{ color: "var(--text-faint)" }} />
        <input
          autoFocus
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search in conversation"
          className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[var(--text-faint)]"
          style={{ color: "var(--text)" }}
        />
        {query.trim() && (
          <span className="shrink-0 text-[11px] tabular-nums" style={{ color: "var(--text-muted)" }}>
            {matchCount ? `${matchIndex + 1}/${matchCount}` : "0/0"}
          </span>
        )}
        <button type="button" onClick={onPrev} disabled={!matchCount} className="grid h-7 w-7 place-items-center rounded-full disabled:opacity-30" style={{ color: "var(--text-muted)" }} aria-label="Previous result">
          <ChevronUp size={16} />
        </button>
        <button type="button" onClick={onNext} disabled={!matchCount} className="grid h-7 w-7 place-items-center rounded-full disabled:opacity-30" style={{ color: "var(--text-muted)" }} aria-label="Next result">
          <ChevronDown size={16} />
        </button>
        <button type="button" onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full" style={{ color: "var(--text-muted)" }} aria-label="Close search">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
