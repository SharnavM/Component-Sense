import { createContext, useContext, useState, useEffect, useCallback } from "react";

const DEFAULTS = {
  saveChatsToStorage: false,
};

const STORAGE_KEY = "ragdocs_settings";

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });


  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {

    }
  }, [settings]);

  const setSetting = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleSetting = useCallback((key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);


  const clearChatHistory = useCallback(() => {
    try {
      localStorage.removeItem("ragdocs_chats");
    } catch {

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


export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside <SettingsProvider>");
  return ctx;
}
