import { useState, useEffect, useRef } from "react";

function toTitleCase(str: string) {
  return str
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.substring(1))
    .join(" ");
}

const useStreamingText = (text: string, cps = Infinity) => {
  const [displayed, setDisplayed] = useState("");
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (cps <= 0 || !text) {
      setDisplayed(text);
      return;
    }

    let index = 0;
    let startTime: number | null = null;
    const durationPerChar = 1000 / cps; // ms per char

    setDisplayed("");

    const step = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;

      const nextIndex = Math.min(
        text.length,
        Math.floor(elapsed / durationPerChar),
      );

      if (nextIndex > index) {
        setDisplayed(text.slice(0, nextIndex));
        index = nextIndex;
      }

      if (index < text.length) {
        frameRef.current = requestAnimationFrame(step);
      }
    };

    frameRef.current = requestAnimationFrame(step);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [text, cps]);

  return displayed;
};

export function streamText(
  fullText: string,
  cps: number,
  onUpdate: (chunk: string) => void,
  onDone?: () => void,
  onStart?: () => void,
): () => void {
  let index = 0;
  const delay = cps > 0 ? 1000 / cps : 0;
  let lastTime = performance.now();
  let rafId: number | null = null;
  let cancelled = false;

  const tick = (now: number) => {
    if (cancelled) return;

    const elapsed = now - lastTime;

    if (elapsed >= delay) {
      const steps =
        delay > 0 ? Math.max(1, Math.floor(elapsed / delay)) : fullText.length;
      lastTime = now;
      index = Math.min(fullText.length, index + steps);
      onUpdate(fullText.slice(0, index));
    }

    if (index < fullText.length) {
      rafId = requestAnimationFrame(tick);
    } else if (!cancelled) {
      onDone?.();
    }
  };

  onStart?.();
  rafId = requestAnimationFrame(tick);

  return () => {
    cancelled = true;
    if (rafId !== null) cancelAnimationFrame(rafId);
  };
}

export { toTitleCase, useStreamingText };
