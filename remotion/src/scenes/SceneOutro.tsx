import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { C, body, display } from "../theme";
import { Sub } from "../components/Bits";

export const SceneOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 18, stiffness: 110 } });
  const line = spring({ frame: frame - 22, fps, config: { damping: 200 } });
  const glow = interpolate(Math.sin(frame / 22), [-1, 1], [0.55, 1]);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}>
      <div
        style={{
          opacity: s,
          transform: `scale(${interpolate(s, [0, 1], [0.9, 1])})`,
        }}
      >
        <div style={{ fontFamily: body, fontSize: 26, letterSpacing: 6, color: C.purpleSoft, textTransform: "uppercase" }}>
          Free to start · No sign-in needed
        </div>
        <h1
          style={{
            fontFamily: display,
            fontWeight: 800,
            fontSize: 130,
            letterSpacing: -5,
            color: C.text,
            margin: "26px 0 0",
            lineHeight: 1.02,
          }}
        >
          Study without limits.
        </h1>
        <div
          style={{
            margin: "26px auto 0",
            width: interpolate(line, [0, 1], [0, 420]),
            height: 8,
            borderRadius: 99,
            background: `linear-gradient(90deg, ${C.purple}, ${C.mint})`,
            boxShadow: `0 0 ${34 * glow}px ${C.purple}`,
          }}
        />
        <div style={{ marginTop: 40, display: "flex", justifyContent: "center" }}>
          <Sub delay={30}>Upload your first PDF and see your study kit in seconds.</Sub>
        </div>
      </div>
    </AbsoluteFill>
  );
};
