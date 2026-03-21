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

/**
 * StatusIndicator
 * Fixed bottom-right dot that shows backend connection state.
 *
 * Props:
 *   status – 'connected' | 'connecting' | 'disconnected'
 */
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
    <div
      style={{
        position: "fixed",
        bottom: 22,
        right: 22,
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexDirection: "row-reverse",
      }}
    >
      {/* The dot */}
      <div
        style={{
          position: "relative",
          width: 14,
          height: 14,
          cursor: "default",
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {/* Pulse ring for connected state */}
        {cfg.pulse && (
          <div
            className="pulse-ring"
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: cfg.color,
              opacity: 0.6,
            }}
          />
        )}

        {/* Spinning arc for connecting state */}
        {cfg.spin && (
          <svg
            className="spin-loader"
            style={{ position: "absolute", inset: 0 }}
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

        {/* Core dot */}
        <motion.div
          style={{
            position: "absolute",
            inset: cfg.spin ? 3 : 0,
            borderRadius: "50%",
            background: cfg.color,
          }}
        />
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {hover && (
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.18 }}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              background: "rgba(18,18,18,0.96)",
              border: "1px solid rgba(255,255,255,0.1)",
              fontSize: "12px",
              fontWeight: 500,
              color: "rgba(255,255,255,0.8)",
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              whiteSpace: "nowrap",
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: cfg.color,
                marginRight: 7,
                verticalAlign: "middle",
              }}
            />
            {cfg.label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
