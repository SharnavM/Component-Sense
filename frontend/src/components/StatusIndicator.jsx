import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STATUS = {
  connected: {
    color: "#22C55E",
    label: "Backend connected",
    pulse: true,
    spin: false,
  },
  connecting: {
    color: "#F59E0B",
    label: "Connecting to backend…",
    pulse: false,
    spin: true,
  },
  disconnected: {
    color: "#EF4444",
    label: "Backend unreachable",
    pulse: false,
    spin: false,
  },
};

export default function StatusIndicator({ setParentState }) {
  const [hover, setHover] = useState(false);
  const [status, setStatus] = useState("disconnected");

  const BACKEND_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const getStatus = async () => {
      try {
        setStatus("connecting");
        console.log("connecting");

        const res = await fetch(`${BACKEND_URL}/api/health`);
        const data = await res.json();

        if (data.status === "awake and ready") {
          setParentState(true);
          setStatus("connected");
          console.log("connected");
        } else {
          setParentState(false);
          setStatus("disconnected");
        }
      } catch (e) {
        console.log(e);
        setParentState(false);
        setStatus("disconnected");
      }
    };

    getStatus();
  }, [setParentState]);

  const cfg = STATUS[status] ?? STATUS.disconnected;

  return (
    <div className="fixed bottom-5 right-5 z-[999] flex items-center gap-2.5 flex-row-reverse">
      <div
        className="relative w-3.5 h-3.5 cursor-default"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {cfg.pulse && (
          <div
            className="pulse-ring absolute inset-0 rounded-full opacity-60"
            style={{ background: cfg.color }}
          />
        )}

        {cfg.spin && (
          <svg
            className="spin-loader absolute inset-0"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
          >
            <circle
              cx="7"
              cy="7"
              r="5.5"
              stroke="rgba(245,158,11,0.25)"
              strokeWidth="2"
            />
            <path
              d="M7 1.5C10.59 1.5 13.5 4.41 13.5 8"
              stroke="#F59E0B"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )}

        <motion.div
          className="absolute rounded-full"
          style={{
            inset: cfg.spin ? 3 : 0,
            background: cfg.color,
          }}
        />
      </div>

      <AnimatePresence>
        {hover && (
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.18 }}
            className="px-3 py-1.5 rounded-lg bg-[#121212]/96 border border-white/10 text-xs font-medium text-white/80 font-jakarta whitespace-nowrap pointer-events-none"
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle"
              style={{ background: cfg.color }}
            />
            {cfg.label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
