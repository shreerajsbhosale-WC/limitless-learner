import { useEffect, useRef } from "react";
import { drawSprite, spriteFromSeed, GRID, type SpriteDirection, type SpriteSpec } from "@/lib/pixel-sprite";

type Props = {
  seed: string;
  spec?: Partial<SpriteSpec>;
  size?: number;
  className?: string;
  bob?: boolean;
  direction?: SpriteDirection;
};

export function PixelSprite({ seed, spec, size = 96, className = "", bob = false, direction = "down" }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const scale = Math.max(1, Math.round(size / GRID));

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawSprite(ctx, spriteFromSeed(seed, spec), scale, direction);
  }, [seed, spec, scale, direction]);

  return (
    <canvas
      ref={ref}
      width={GRID * scale}
      height={GRID * scale}
      style={{ imageRendering: "pixelated", width: GRID * scale, height: GRID * scale }}
      className={`${bob ? "animate-[bob_1.6s_ease-in-out_infinite]" : ""} ${className}`}
      aria-hidden
    />
  );
}
