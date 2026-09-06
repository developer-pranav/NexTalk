import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const OPTIONS = [
  { key: "system", label: "System", icon: Laptop },
  { key: "light", label: "Light", icon: Sun },
  { key: "dark", label: "Dark", icon: Moon },
];

export default function ThemeSwitch() {
  const { preference, setThemePreference } = useTheme();

  return (
    <div>
      <p className="mb-2.5 text-[13px] font-medium" style={{ color: "var(--text)" }}>
        Appearance
      </p>
      <div className="grid grid-cols-3 gap-1.5 rounded-xl p-1.5" style={{ background: "var(--surface-2)" }}>
        {OPTIONS.map(({ key, label, icon: Icon }) => {
          const active = preference === key;
          return (
            <button
              key={key}
              onClick={() => setThemePreference(key)}
              className="flex flex-col items-center gap-1.5 rounded-lg py-2.5 text-[12.5px] font-medium transition-all duration-150"
              style={{
                background: active ? "var(--surface)" : "transparent",
                color: active ? "var(--accent)" : "var(--text-muted)",
                boxShadow: active ? "var(--shadow-sm)" : "none",
              }}
            >
              <Icon size={17} />
              {label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[12px]" style={{ color: "var(--text-faint)" }}>
        {preference === "system"
          ? "Matches your device's appearance automatically."
          : `Always use ${preference} mode in this app.`}
      </p>
    </div>
  );
}
