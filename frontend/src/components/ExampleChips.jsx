import { motion } from "framer-motion";

export default function ExampleChips({ examples, onSelect }) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span className="font-['Bricolage_Grotesque',sans-serif] text-[13px] font-semibold text-black/55 whitespace-nowrap tracking-wide mr-0.5">
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
          className="px-4 py-[9px] rounded-full bg-[#0a0a0a]/70 border border-white/5 text-white/70 text-[13px] font-jakarta font-medium cursor-pointer outline-none transition-colors hover:text-white"
        >
          {ex}
        </motion.button>
      ))}
    </div>
  );
}
