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
