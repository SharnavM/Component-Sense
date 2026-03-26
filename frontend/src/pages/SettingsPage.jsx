import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "../context/SettingsContext";
import Reveal from "../components/Reveal";
import { useSidebar } from "../context/SidebarContext";
import { useChat } from "../context/ChatContext";

function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`shrink-0 w-11 h-[26px] rounded-full border-none cursor-pointer p-[3px] flex items-center outline-none transition-colors duration-250 ${checked ? "bg-[#f65294]" : "bg-white/10"
        }`}
    >
      <motion.div
        animate={{ x: checked ? 18 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 34 }}
        className="w-5 h-5 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.35)]"
      />
    </button>
  );
}

function SettingRow({ label, description, children, accent = false }) {
  return (
    <div className="flex items-center px-4 md:px-5 py-4 md:py-[18px] gap-2 md:gap-3">
      <div className="flex-1 min-w-0">
        <p
          className={`font-['Bricolage_Grotesque',sans-serif] text-[13px] md:text-[14px] font-bold m-0 mb-1 leading-[1.3] ${accent ? "text-[#f65294]" : "text-white/90"
            }`}
        >
          {label}
        </p>
        {description && (
          <p className="font-jakarta text-[12px] md:text-[13px] text-white/30 leading-[1.6] m-0">
            {description}
          </p>
        )}
      </div>
      <div className="shrink-0 ml-2 md:ml-6">{children}</div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="font-['Bricolage_Grotesque',sans-serif] text-[11px] font-bold tracking-[0.1em] uppercase text-white/20 m-0 mb-2.5">
      {children}
    </p>
  );
}

function InfoBanner({ icon, children }) {
  return (
    <div className="flex items-start gap-3 px-5 py-4 bg-[#f65294]/[0.07] border-b border-[#f65294]/[0.12]">
      <span className="text-[15px] shrink-0 leading-none">{icon}</span>
      <p className="font-jakarta text-[13px] text-white/45 leading-[1.65] m-0">
        {children}
      </p>
    </div>
  );
}

function ClearButton({ onConfirm, clearDone }) {
  const [confirming, setConfirming] = useState(false);

  const handleClick = () => {
    if (confirming) {
      onConfirm();
      setConfirming(false);
    } else {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={clearDone}
      whileTap={{ scale: 0.96 }}
      animate={{ width: "auto" }}
      className={`px-2.5 py-1.5 md:px-5 md:py-[9px] rounded-lg md:rounded-[10px] font-['Bricolage_Grotesque',sans-serif] text-[11.5px] md:text-[13px] font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap border ${confirming
        ? "bg-red-500/10 border-red-500/50 text-red-400"
        : "bg-white/[0.04] border-white/10 text-white/50"
        }`}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={confirming ? "confirm" : "idle"}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="block"
        >
          {confirming ? "Press again to confirm" : "Clear saved chats"}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

export default function SettingsPage() {
  const [clearDone, setClearDone] = useState(false);

  const { settings, toggleSetting, clearChatHistory } = useSettings();
  const { sidebarW } = useSidebar();
  const { clearAllChats } = useChat();

  const handleClear = () => {
    clearChatHistory();
    clearAllChats();
    setClearDone(true);
    setTimeout(() => setClearDone(false), 2500);
  };

  return (
    <>
      <div className="fixed inset-0 z-0 bg-[#0A0A0A]" />

      <motion.main
        className="relative z-10 flex flex-col flex-1 h-[100dvh] overflow-y-auto overflow-x-hidden"
        animate={{ marginLeft: sidebarW }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
      >
        <div className="max-w-[680px] mx-auto pt-[72px] px-8 pb-[80px] w-full">
          <Reveal style={{ marginBottom: 48 }}>
            <p className="font-jakarta text-[12px] font-semibold tracking-[0.1em] uppercase text-[#f65294] m-0 mb-3">
              Preferences
            </p>
            <h1 className="font-['Bricolage_Grotesque',sans-serif] text-[clamp(2rem,4vw,2.8rem)] font-extrabold text-white/90 leading-[1.15] tracking-[-0.02em] m-0 mb-[14px]">
              Settings
            </h1>
            <p className="font-jakarta text-[1rem] text-white/40 leading-[1.7] m-0">
              Adjust how the app behaves. Changes are saved automatically.
            </p>
          </Reveal>

          <Reveal delay={0.05} style={{ marginBottom: 12 }}>
            <SectionLabel>Chat behaviour</SectionLabel>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden">
              <InfoBanner icon="⚡">
                <strong className="text-white/75 font-semibold">
                  Each message is fully independent.
                </strong>{" "}
                The AI has no memory of previous messages in the session. Every
                query sent to the model is fresh, without any prior conversation
                as context.
              </InfoBanner>

              <div className="h-px bg-white/[0.06] mx-5" />

              <SettingRow
                label="Save new chats to local storage"
                description="Persist your conversation history in this browser so it survives page reloads. Chats are never sent to a server."
              >
                <Toggle
                  checked={settings.saveChatsToStorage}
                  onChange={() => toggleSetting("saveChatsToStorage")}
                />
              </SettingRow>

              <AnimatePresence>
                {settings.saveChatsToStorage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="h-px bg-white/[0.06] mx-5 mt-0" />
                    <SettingRow
                      label="Clear saved chat history"
                      description="Permanently remove all chats stored in this browser's local storage."
                    >
                      <div className="flex flex-col md:flex-row items-end md:items-center gap-1.5 md:gap-3">
                        <AnimatePresence>
                          {clearDone && (
                            <motion.span
                              initial={{ opacity: 0, x: 6 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="font-jakarta text-[11px] md:text-[12px] font-semibold text-[#48bb78] whitespace-nowrap"
                            >
                              ✓ Cleared
                            </motion.span>
                          )}
                        </AnimatePresence>
                        <ClearButton
                          clearDone={clearDone}
                          onConfirm={handleClear}
                        />
                      </div>
                    </SettingRow>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        </div>
      </motion.main>
    </>
  );
}

