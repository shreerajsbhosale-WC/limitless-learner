import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { C, body, display, glass } from "../theme";
import { Eyebrow, Title, Sub } from "../components/Bits";
import { Icon } from "../components/Icon";

export const SceneGamify: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const xp = Math.round(interpolate(frame, [30, 105], [0, 2480], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }));
  const bar = interpolate(frame, [30, 105], [0, 78], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const card = spring({ frame: frame - 20, fps, config: { damping: 16 } });

  return (
    <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", padding: "0 130px", gap: 80 }}>
      <div style={{ flex: 1 }}>
        <Eyebrow delay={0}>Step 04</Eyebrow>
        <div style={{ height: 26 }} />
        <Title delay={5} size={84}>
          Studying that
          <br />
          feels like levelling up.
        </Title>
        <div style={{ height: 24 }} />
        <Sub delay={14}>Earn XP, keep streaks alive, and flip on Exam Mode for 1.5× rewards.</Sub>
      </div>

      <div
        style={{
          width: 640,
          opacity: card,
          transform: `translateX(${interpolate(card, [0, 1], [70, 0])}px)`,
        }}
      >
        <div style={{ ...glass, padding: 40, boxShadow: "0 40px 100px rgba(0,0,0,0.5)" }}>
          <div style={{ fontFamily: body, fontSize: 24, color: C.muted, letterSpacing: 2 }}>TOTAL XP</div>
          <div
            style={{
              fontFamily: display,
              fontWeight: 800,
              fontSize: 110,
              color: C.text,
              lineHeight: 1.05,
              letterSpacing: -3,
            }}
          >
            {xp.toLocaleString()}
          </div>
          <div style={{ height: 14, borderRadius: 99, background: "rgba(255,255,255,0.08)", marginTop: 18 }}>
            <div
              style={{
                height: "100%",
                width: `${bar}%`,
                borderRadius: 99,
                background: `linear-gradient(90deg, ${C.purple}, ${C.mint})`,
                boxShadow: `0 0 26px ${C.purple}aa`,
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 34 }}>
            {[
              { i: "flame", k: "12", v: "day streak" },
              { i: "cap", k: "Lv 9", v: "Scholar" },
              { i: "swords", k: "1.5×", v: "Exam Mode" },
            ].map((s) => (
              <div
                key={s.v}
                style={{
                  flex: 1,
                  borderRadius: 18,
                  padding: "18px 16px",
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${C.line}`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Icon name={s.i} size={28} color={C.purpleSoft} />
                <div style={{ fontFamily: display, fontWeight: 700, fontSize: 32, color: C.text }}>{s.k}</div>
                <div style={{ fontFamily: body, fontSize: 20, color: C.muted }}>{s.v}</div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </AbsoluteFill>
  );
};
