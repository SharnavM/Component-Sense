import { createContext, useContext, useState, useCallback, useEffect } from "react";

const SIDEBAR_CLOSED = 52;
const SIDEBAR_OPEN = 240;

const SidebarContext = createContext(null);

export function SidebarProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggle = useCallback(() => setIsOpen((o) => !o), []);
  const close = useCallback(() => setIsOpen(false), []);

  const sidebarW = isMobile ? 0 : (isOpen ? SIDEBAR_OPEN : SIDEBAR_CLOSED);

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, close, sidebarW, isMobile }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used inside <SidebarProvider>");
  return ctx;
}
