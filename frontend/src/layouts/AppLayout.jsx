import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useSidebar } from "../context/SidebarContext";
import StatusIndicator from "../components/StatusIndicator";
import { useEffect, useState } from "react";

/**
 * AppLayout
 * Rendered once at the router root. Owns the single <Sidebar> instance
 * that persists across every page — state survives navigation.
 *
 * <Outlet /> is where React Router mounts the current page.
 * Each page just renders its own <motion.main> with marginLeft: sidebarW.
 */
export default function AppLayout() {
  const { isOpen, toggle } = useSidebar();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    console.log("AppLayout isConnected:", isConnected);
  }, [isConnected]);

  return (
    // Full-screen container — position relative so fixed children
    // (status dot, tabs) are scoped correctly.
    <div
      style={{
        position: "relative",
        display: "flex",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* ── Single Sidebar instance — survives route changes ── */}
      <Sidebar isOpen={isOpen} onToggle={toggle} />

      {/* ── Page area — each page animates its own marginLeft ── */}
      <Outlet context={{ isConnected }} />

      <StatusIndicator setParentState={setIsConnected} />
    </div>
  );
}
