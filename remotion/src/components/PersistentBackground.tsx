import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { C } from "../theme";

export const PersistentBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 90) * 60;
  const drift2 = Math.cos(frame / 70) * 80;
  const pulse = interpolate(Math.sin(frame / 55), [-1, 1], [0.35, 0.6]);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${C.bg} 0%, ${C.bg2} 55%, #0A0E1C 100%)` }}>
      <div
        style={{
          position: "absolute",
          left: -200 + drift,
          top: -260,
          width: 1100,
          height: 1100,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(124,92,252,${pulse}) 0%, rgba(124,92,252,0) 62%)`,
          filter: "blur(40px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -320 + drift2,
          bottom: -380,
          width: 1200,
          height: 1200,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(74,222,155,0.22) 0%, rgba(74,222,155,0) 60%)",
          filter: "blur(40px)",
        }}
      />
      {/* grid */}
      <AbsoluteFill
        style={{
          opacity: 0.16,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          transform: `translateY(${(frame % 72) * -1}px)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
