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
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-3 px-4 py-3 pl-5 rounded-[18px] bg-[#1A1A1A] border border-white/5 transition-colors duration-200">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder="Type a query...."
          rows={1}
          className="flex-1 self-center bg-transparent border-none outline-none resize-none text-white/85 text-[15px] font-jakarta overflow-hidden"
          style={{
            caretColor: "#f65294",
            lineHeight: `${LINE_HEIGHT}px`,
            height: `${LINE_HEIGHT}px`,
          }}
        />

        <motion.button
          onClick={submit}
          disabled={!canSubmit && !isLoading}
          whileTap={canSubmit ? { scale: 0.82 } : {}}
          animate={{ borderRadius: isLoading ? "10px" : "50%" }}
          transition={{ borderRadius: { duration: 0.22, ease: "easeInOut" } }}
          className={`shrink-0 w-9 h-9 border border-white/10 flex items-center justify-center p-0 outline-none transition-colors duration-200 ${canSubmit || isLoading ? "bg-white/15 cursor-pointer" : "bg-white/5 cursor-default"
            }`}
          aria-label={isLoading ? "Generating…" : "Submit"}
        >
          {isLoading ? (
            <svg
              className="spin-loader block"
              width="17"
              height="17"
              viewBox="0 0 17 17"
              fill="none"
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

      <p className="m-0 text-center text-xs tracking-wide text-white/50 font-jakarta transition-colors duration-300">
        {isLoading ? "Generating response…" : "Ready to submit!"}
      </p>
    </div>
  );
}
