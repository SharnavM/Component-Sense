import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useSidebar } from "../context/SidebarContext";
import StatusIndicator from "../components/StatusIndicator";
import { useEffect, useState } from "react";


export default function AppLayout() {
  const { isOpen, toggle } = useSidebar();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    console.log("AppLayout isConnected:", isConnected);
  }, [isConnected]);

  return (

    <div
      style={{
        position: "relative",
        display: "flex",
        height: "100vh",
        overflow: "hidden",
      }}
    >

      <Sidebar isOpen={isOpen} onToggle={toggle} />


      <Outlet context={{ isConnected }} />

      <StatusIndicator setParentState={setIsConnected} />
    </div>
  );
}
