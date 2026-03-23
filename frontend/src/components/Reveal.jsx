import { useRef } from "react";
import { motion, useInView } from "framer-motion";

export default function Reveal({
  children,
  delay = 0,
  style,
  vertical,
  reverse,
  offset = 60,
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: `${-offset}px 0px` });

  return !vertical ? (
    <motion.div
      ref={ref}
      style={style}
      initial={{ opacity: 0, x: reverse ? 20 : 0 }}
      animate={inView ? { opacity: 1, x: reverse ? 0 : 20 } : {}}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  ) : (
    <motion.div
      ref={ref}
      style={style}
      initial={{ opacity: 0, y: reverse ? 0 : 20 }}
      animate={inView ? { opacity: 1, y: reverse ? 20 : 0 } : {}}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
