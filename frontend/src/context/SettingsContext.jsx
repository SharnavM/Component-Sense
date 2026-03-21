import { createContext, useContext, useState, useEffect, useCallback } from "react";

/* ─── Defaults ─────────────────────────────────────────────── */
const DEFAULTS = {
  saveChatsToStorage: false,
};

const STORAGE_KEY = "ragdocs_settings";

/* ─── Context ───────────────────────────────────────────────── */
const SettingsContext = createContext(null);

/* ─── Provider ──────────────────────────────────────────────── */
export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

  /* Persist settings object itself (not chat history) on every change */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* storage unavailable — fail silently */
    }
  }, [settings]);

  /* Generic setter: update one key at a time */
  const setSetting = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  /* Convenience toggle */
  const toggleSetting = useCallback((key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  /* Clear all persisted chat data from localStorage */
  const clearChatHistory = useCallback(() => {
    try {
      localStorage.removeItem("ragdocs_chats");
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <SettingsContext.Provider
      value={{ settings, setSetting, toggleSetting, clearChatHistory }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

/* ─── Hook ──────────────────────────────────────────────────── */
export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside <SettingsProvider>");
  return ctx;
}
