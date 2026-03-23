import { useState, useRef, useLayoutEffect } from "react";
import { motion } from "framer-motion";

const LINE_HEIGHT = 24;
const MAX_LINES = 6;

export default function AIInput({ onSubmit, isLoading }) {
  const [value, setValue] = useState("");
  const textareaRef = useRef(null);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const maxH = LINE_HEIGHT * MAX_LINES;
    el.style.height = `${Math.min(el.scrollHeight, maxH)}px`;
    el.style.overflowY = el.scrollHeight > maxH ? "auto" : "hidden";
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
    setValue("");
    const el = textareaRef.current;
    if (el) {
      el.style.height = `${LINE_HEIGHT}px`;
      el.style.overflowY = "hidden";
    }
  };

  const canSubmit = value.trim().length > 0 && !isLoading;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "12px",
          padding: "12px 16px 12px 20px",
          borderRadius: "18px",
          background: "#1A1A1A",
          border: "1px solid rgba(255,255,255,0.06)",
          transition: "border-color 0.2s",
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder="Type a query...."
          rows={1}
          style={{
            flex: 1,
            alignSelf: "center",
            background: "transparent",
            border: "none",
            outline: "none",
            resize: "none",
            color: "rgba(255,255,255,0.85)",
            caretColor: "#f65294",
            lineHeight: `${LINE_HEIGHT}px`,
            height: `${LINE_HEIGHT}px`,
            overflowY: "hidden",
            fontSize: "15px",
            fontFamily: '"Plus Jakarta Sans", sans-serif',
          }}
        />

        <motion.button
          onClick={submit}
          disabled={!canSubmit && !isLoading}
          whileTap={canSubmit ? { scale: 0.82 } : {}}
          animate={{ borderRadius: isLoading ? "10px" : "50%" }}
          transition={{ borderRadius: { duration: 0.22, ease: "easeInOut" } }}
          style={{
            flexShrink: 0,
            width: 36,
            height: 36,
            border: "1px solid rgba(255,255,255,0.1)",
            background:
              canSubmit || isLoading
                ? "rgba(255,255,255,0.16)"
                : "rgba(255,255,255,0.06)",
            cursor: canSubmit ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            outline: "none",
            transition: "background 0.2s",
          }}
          aria-label={isLoading ? "Generating…" : "Submit"}
        >
          {isLoading ? (
            <svg
              className="spin-loader"
              width="17"
              height="17"
              viewBox="0 0 17 17"
              fill="none"
              style={{ display: "block" }}
            >
              <circle
                cx="8.5"
                cy="8.5"
                r="6"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth="1.8"
              />
              <path
                d="M8.5 2.5C12.09 2.5 15 5.41 15 9"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 11.5V2.5M3 6.5L7 2.5L11 6.5"
                stroke={
                  canSubmit ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)"
                }
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </motion.button>
      </div>

      <p
        style={{
          margin: 0,
          textAlign: "center",
          fontSize: "12px",
          letterSpacing: "0.01em",
          color: "rgba(255,255,255,0.5)",
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          transition: "color 0.3s",
        }}
      >
        {isLoading ? "Generating response…" : "Ready to submit!"}
      </p>
    </div>
  );
}
