import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

/**
 * LibraryTabs
 * A pill-shaped container with a sliding rectangular indicator.
 * The active tab background colour transitions with the app state.
 *
 * Props:
 *   tabs        – object of { id, label } keyed by id
 *   active      – currently active tab id
 *   onChange    – (id: string) => void
 *   chatStarted – bool, drives active-tab colour
 */
export default function LibraryTabs({ tabs, active, onChange, chatStarted }) {
  const tabsArray = Object.values(tabs);
  const tabRefs = useRef([]);
  const [indicator, setIndicator] = useState({ left: 4, width: 0 });

  // Reposition the sliding indicator whenever the active tab changes
  useEffect(() => {
    const idx = tabsArray.findIndex((t) => t.id === active);
    const el = tabRefs.current[idx];
    if (el) {
      setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [active]); // eslint-disable-line

  // Active indicator colour:
  //   landing state → white (contrasts the pink bg)
  //   chat state    → brand pink (contrasts the dark bg)
  const indicatorBg = chatStarted
    ? (tabs[active].indicatorBg ?? "#f65294")
    : "#f65294";
  const activeColor = chatStarted ? "#ffffff" : "#111111";
  const inactiveColor = "rgba(255,255,255,0.55)";

  return (
    <div
      style={{
        display: "inline-flex",
        position: "relative",
        padding: "4px",
        borderRadius: "14px",
        background: "rgba(12,12,12,0.78)",
        backdropFilter: "blur(14px)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Sliding background */}
      <motion.div
        aria-hidden
        style={{
          position: "absolute",
          top: 4,
          bottom: 4,
          borderRadius: "10px",
          zIndex: 0,
          background: indicatorBg,
        }}
        animate={{
          left: indicator.left,
          width: indicator.width,
          backgroundColor: indicatorBg,
        }}
        transition={{ type: "spring", stiffness: 460, damping: 36 }}
      />

      {tabsArray.map((tab, idx) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            ref={(el) => (tabRefs.current[idx] = el)}
            onClick={() => onChange(tab.id)}
            style={{
              position: "relative",
              zIndex: 1,
              padding: "10px 32px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              borderRadius: "10px",
              fontFamily: "Bricolage Grotesque, sans-serif",
              fontSize: "15px",
              fontWeight: 600,
              letterSpacing: "0.01em",
              color: isActive ? activeColor : inactiveColor,
              transition: "color 0.25s",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
