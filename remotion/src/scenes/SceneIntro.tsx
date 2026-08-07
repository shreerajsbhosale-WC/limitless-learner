import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { C, display, body } from "../theme";
import { Eyebrow } from "../components/Bits";

export const SceneIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 8, fps, config: { damping: 200, stiffness: 60 } });
  const wipe = interpolate(s, [0, 1], [100, 0]);
  const sub = spring({ frame: frame - 34, fps, config: { damping: 24 } });
  const glow = interpolate(Math.sin(frame / 26), [-1, 1], [0.5, 1]);

  return (
    <AbsoluteFill style={{ justifyContent: "center", paddingLeft: 150 }}>
      <Eyebrow delay={0}>A beginner&apos;s tour</Eyebrow>
      <div style={{ height: 42 }} />
      <div style={{ overflow: "hidden" }}>
        <h1
          style={{
            fontFamily: display,
            fontWeight: 800,
            fontSize: 178,
            letterSpacing: -7,
            margin: 0,
            color: C.text,
            clipPath: `inset(0 ${wipe}% 0 0)`,
            lineHeight: 1,
          }}
        >
          Limitless
        </h1>
      </div>
      <div
        style={{
          marginTop: 14,
          width: interpolate(s, [0, 1], [0, 520]),
          height: 8,
          borderRadius: 99,
          background: `linear-gradient(90deg, ${C.purple}, ${C.mint})`,
          boxShadow: `0 0 ${30 * glow}px ${C.purple}`,
        }}
      />
      <p
        style={{
          fontFamily: body,
          fontSize: 38,
          color: C.muted,
          marginTop: 34,
          opacity: sub,
          transform: `translateY(${interpolate(sub, [0, 1], [26, 0])}px)`,
        }}
      >
        Study without limits — here&apos;s everything you get.
      </p>
    </AbsoluteFill>
  );
};
