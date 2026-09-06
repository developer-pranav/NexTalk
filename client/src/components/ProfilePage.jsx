import { ArrowLeft } from "lucide-react";
import ProfileScreen from "./ProfileScreen";

export default function ProfilePage({ onBack }) {
  return (
    <div
      className="flex h-full min-h-0 flex-col anim-mobile-page-in"
      style={{ background: "var(--bg)" }}
    >
      <div
        className="flex shrink-0 items-center gap-3 px-4 py-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <button
          onClick={onBack}
          className="grid h-9 w-9 place-items-center rounded-full transition-transform active:scale-90"
          style={{ background: "var(--surface)", color: "var(--text)", boxShadow: "var(--shadow-sm)" }}
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <p className="text-[16px] font-semibold" style={{ color: "var(--text)" }}>
          My Profile
        </p>
      </div>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 py-5">
        <div className="mx-auto w-full max-w-xl">
          <ProfileScreen />
        </div>
      </div>
    </div>
  );
}
