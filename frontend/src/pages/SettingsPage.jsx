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
      style={{
        flexShrink: 0,
        width: 44,
        height: 26,
        borderRadius: 13,
        border: "none",
        cursor: "pointer",
        padding: 3,
        display: "flex",
        alignItems: "center",
        background: checked ? "#f65294" : "rgba(255,255,255,0.12)",
        transition: "background 0.25s ease",
        outline: "none",
      }}
    >
      <motion.div
        animate={{ x: checked ? 18 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 34 }}
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "white",
          boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
        }}
      />
    </button>
  );
}

function SettingRow({ label, description, children, accent = false }) {
  return (
    <div style={styles.row}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            ...styles.rowLabel,
            color: accent ? "#f65294" : "rgba(255,255,255,0.88)",
          }}
        >
          {label}
        </p>
        {description && <p style={styles.rowDesc}>{description}</p>}
      </div>
      <div style={{ flexShrink: 0, marginLeft: 24 }}>{children}</div>
    </div>
  );
}

function SectionLabel({ children }) {
  return <p style={styles.sectionLabel}>{children}</p>;
}

function InfoBanner({ icon, children }) {
  return (
    <div style={styles.infoBanner}>
      <span style={{ fontSize: 15, flexShrink: 0, lineHeight: 1 }}>{icon}</span>
      <p style={styles.infoBannerText}>{children}</p>
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
      style={{
        padding: "9px 20px",
        borderRadius: "10px",
        border: `1px solid ${confirming ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
        background: confirming
          ? "rgba(239,68,68,0.12)"
          : "rgba(255,255,255,0.04)",
        color: confirming ? "#f87171" : "rgba(255,255,255,0.5)",
        fontFamily: "Bricolage Grotesque, sans-serif",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s ease",
        whiteSpace: "nowrap",
      }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={confirming ? "confirm" : "idle"}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          style={{ display: "block" }}
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
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          backgroundColor: "#0A0A0A",
        }}
      />

      <motion.main
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          flex: 1,
          height: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
        }}
        animate={{ marginLeft: sidebarW }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
      >
        <div
          style={{
            maxWidth: 680,
            margin: "0 auto",
            padding: "72px 32px 80px",
            width: "100%",
          }}
        >
          <Reveal style={{ marginBottom: 48 }}>
            <p style={styles.eyebrow}>Preferences</p>
            <h1 style={styles.pageTitle}>Settings</h1>
            <p style={styles.lead}>
              Adjust how the app behaves. Changes are saved automatically.
            </p>
          </Reveal>

          <Reveal delay={0.05} style={{ marginBottom: 12 }}>
            <SectionLabel>Chat behaviour</SectionLabel>
          </Reveal>

          <Reveal delay={0.1}>
            <div style={styles.card}>
              <InfoBanner icon="⚡">
                <strong
                  style={{ color: "rgba(255,255,255,0.75)", fontWeight: 600 }}
                >
                  Each message is fully independent.
                </strong>{" "}
                The AI has no memory of previous messages in the session. Every
                query sent to the model is fresh, without any prior conversation
                as context.
              </InfoBanner>

              <div style={styles.divider} />

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
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{ ...styles.divider, marginTop: 0 }} />
                    <SettingRow
                      label="Clear saved chat history"
                      description="Permanently remove all chats stored in this browser's local storage."
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <AnimatePresence>
                          {clearDone && (
                            <motion.span
                              initial={{ opacity: 0, x: 6 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              style={styles.clearDoneTag}
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

const styles = {
  eyebrow: {
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#f65294",
    marginBottom: 12,
    margin: "0 0 12px",
  },
  pageTitle: {
    fontFamily: "Bricolage Grotesque, sans-serif",
    fontSize: "clamp(2rem, 4vw, 2.8rem)",
    fontWeight: 800,
    color: "rgba(255,255,255,0.92)",
    lineHeight: 1.15,
    letterSpacing: "-0.02em",
    margin: "0 0 14px",
  },
  lead: {
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    fontSize: "1rem",
    color: "rgba(255,255,255,0.38)",
    lineHeight: 1.7,
    margin: 0,
  },
  sectionLabel: {
    fontFamily: "Bricolage Grotesque, sans-serif",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.22)",
    margin: "0 0 10px",
  },
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    overflow: "hidden",
  },
  divider: {
    height: "1px",
    background: "rgba(255,255,255,0.06)",
    margin: "0 20px",
  },
  row: {
    display: "flex",
    alignItems: "center",
    padding: "18px 20px",
    gap: 12,
  },
  rowLabel: {
    fontFamily: "Bricolage Grotesque, sans-serif",
    fontSize: "14px",
    fontWeight: 700,
    margin: "0 0 4px",
    lineHeight: 1.3,
  },
  rowDesc: {
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    fontSize: "13px",
    color: "rgba(255,255,255,0.32)",
    lineHeight: 1.6,
    margin: 0,
  },
  infoBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    padding: "16px 20px",
    background: "rgba(246,82,148,0.07)",
    borderBottom: "1px solid rgba(246,82,148,0.12)",
  },
  infoBannerText: {
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    fontSize: "13px",
    color: "rgba(255,255,255,0.45)",
    lineHeight: 1.65,
    margin: 0,
  },
  codeTag: {
    fontFamily: '"Fira Code", "Cascadia Code", monospace',
    fontSize: "12px",
    padding: "4px 10px",
    borderRadius: "6px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.55)",
    whiteSpace: "nowrap",
  },
  badge: {
    fontFamily: "Bricolage Grotesque, sans-serif",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.05em",
    padding: "4px 10px",
    borderRadius: "100px",
    whiteSpace: "nowrap",
  },
  clearDoneTag: {
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    fontSize: "12px",
    fontWeight: 600,
    color: "#48bb78",
    whiteSpace: "nowrap",
  },
};
