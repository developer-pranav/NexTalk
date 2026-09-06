import { ThemeProvider } from "./context/ThemeContext";
import { ChatProvider } from "./context/ChatContext";
import { useBreakpoint } from "./hooks/useBreakpoint";
import DesktopLayout from "./layouts/DesktopLayout";
import TabletLayout from "./layouts/TabletLayout";
import MobileLayout from "./layouts/MobileLayout";

function Shell() {
  const breakpoint = useBreakpoint();

  return (
    <div className="h-full w-full overflow-hidden">
      {breakpoint === "mobile" && <MobileLayout />}
      {breakpoint === "tablet" && <TabletLayout />}
      {breakpoint === "desktop" && <DesktopLayout />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ChatProvider>
        <Shell />
      </ChatProvider>
    </ThemeProvider>
  );
}
