import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function LibraryTabs({ tabs, active, onChange, chatStarted }) {
  const tabsArray = Object.values(tabs);
  const tabRefs = useRef([]);
  const [indicator, setIndicator] = useState({ left: 4, width: 0 });

  useEffect(() => {
    const idx = tabsArray.findIndex((t) => t.id === active);
    const el = tabRefs.current[idx];
    if (el) {
      setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [active]);

  const indicatorBg = chatStarted
    ? (tabs[active].indicatorBg ?? "#f65294")
    : "#f65294";
  const activeColor = chatStarted ? "#ffffff" : "#111111";

  return (
    <div className="inline-flex relative p-1 md:p-1.5 rounded-[14px] bg-[#0c0c0c]/75 backdrop-blur-md border border-white/10">
      <motion.div
        aria-hidden
        className="absolute top-1 bottom-1 md:top-1.5 md:bottom-1.5 rounded-[10px] z-0"
        style={{ background: indicatorBg }}
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
            className="relative z-10 px-4 py-1.5 md:px-8 md:py-2.5 border-none bg-transparent cursor-pointer rounded-[10px] font-['Bricolage_Grotesque',sans-serif] text-xs md:text-[15px] font-semibold tracking-wide whitespace-nowrap transition-colors duration-250"
            style={{
              color: isActive ? activeColor : "rgba(255,255,255,0.55)",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
