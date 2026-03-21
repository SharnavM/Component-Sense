import { createContext, useContext, useState, useCallback } from "react";

const SIDEBAR_CLOSED = 52;
const SIDEBAR_OPEN   = 240;

const SidebarContext = createContext(null);

export function SidebarProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = useCallback(() => setIsOpen((o) => !o), []);
  const close  = useCallback(() => setIsOpen(false), []);

  const sidebarW = isOpen ? SIDEBAR_OPEN : SIDEBAR_CLOSED;

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, close, sidebarW }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used inside <SidebarProvider>");
  return ctx;
}
