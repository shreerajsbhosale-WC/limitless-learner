import { useEffect, useRef, useState } from "react";
import { drawVfx, GRID, type EffectKey } from "@/lib/pixel-sprite";

type Props = {
  effect: Exclude<EffectKey, "none">;
  size?: number;
  className?: string;
};

/** Low-FPS looping pixel VFX (fireball, slash, spark, aura) — 3-frame cycle. */
export function PixelVfx({ effect, size = 72, className = "" }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [frame, setFrame] = useState(0);
  const scale = Math.max(1, Math.round(size / GRID));

  useEffect(() => {
    const t = setInterval(() => setFrame((f) => (f + 1) % 3), 180);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    drawVfx(ctx, effect, frame, scale);
  }, [effect, frame, scale]);

  return (
    <canvas
      ref={ref}
      width={GRID * scale}
      height={GRID * scale}
      style={{ imageRendering: "pixelated", width: GRID * scale, height: GRID * scale }}
      className={className}
      aria-hidden
    />
  );
}
