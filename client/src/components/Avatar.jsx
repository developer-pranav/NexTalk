const SIZES = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-[13px]",
  lg: "h-12 w-12 text-[15px]",
  xl: "h-16 w-16 text-lg",
  "2xl": "h-24 w-24 text-2xl",
};

export default function Avatar({ name, initials, color, size = "md", online, showPresence = false }) {
  return (
    <div className="relative shrink-0" title={name}>
      <div
        className={`${SIZES[size]} flex items-center justify-center rounded-full font-medium select-none`}
        style={{ backgroundColor: `${color}1F`, color }}
      >
        {initials}
      </div>
      {showPresence && (
        <span
          className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2"
          style={{
            backgroundColor: online ? "var(--online)" : "var(--text-faint)",
            borderColor: "var(--surface)",
          }}
        />
      )}
    </div>
  );
}
