import { motion } from "framer-motion";

/**
 * ExampleChips
 * Renders a flex-wrap grid of dark pill chips prefixed with "Examples:".
 *
 * Props:
 *   examples – string[]
 *   onSelect – (example: string) => void
 */
export default function ExampleChips({ examples, onSelect }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "10px",
      }}
    >
      {/* Label */}
      <span
        style={{
          fontFamily: "Bricolage Grotesque, sans-serif",
          fontSize: "13px",
          fontWeight: 600,
          color: "rgba(0,0,0,0.55)",
          whiteSpace: "nowrap",
          letterSpacing: "0.02em",
          marginRight: "2px",
        }}
      >
        Examples:
      </span>

      {examples.map((ex, i) => (
        <motion.button
          key={ex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            delay: 0.05 + i * 0.06,
            ease: "easeOut",
          }}
          whileHover={{ scale: 1.03, backgroundColor: "rgba(10,10,10,0.88)" }}
          whileTap={{ scale: 0.96 }}
          onClick={() => onSelect(ex)}
          style={{
            padding: "9px 16px",
            borderRadius: "100px",
            background: "rgba(10,10,10,0.72)",
            border: "1px solid rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.68)",
            fontSize: "13px",
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: 500,
            cursor: "pointer",
            outline: "none",
            transition: "color 0.2s",
          }}
        >
          {ex}
        </motion.button>
      ))}
    </div>
  );
}
