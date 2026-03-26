import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useSidebar } from "../context/SidebarContext";
import StatusIndicator from "../components/StatusIndicator";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";


export default function AppLayout() {
  const { isOpen, toggle } = useSidebar();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
  }, [isConnected]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {!isOpen && (
        <button
          onClick={toggle}
          className="fixed top-4 left-4 z-50 p-2 text-white bg-black/40 backdrop-blur rounded-full md:hidden hover:bg-black/60 transition-colors"
          aria-label="Open Sidebar"
        >
          <Menu size={20} />
        </button>
      )}

      <Sidebar isOpen={isOpen} onToggle={toggle} />


      <Outlet context={{ isConnected }} />

      <StatusIndicator setParentState={setIsConnected} />
    </div>
  );
}
