import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { C, body, display, glass } from "../theme";
import { Eyebrow, Title } from "../components/Bits";
import { Icon } from "../components/Icon";

const rows = [
  { icon: "notes", label: "Dashboard" },
  { icon: "file", label: "Study" },
  { icon: "leaf", label: "Habits" },
  { icon: "timer", label: "Focus" },
  { icon: "chart", label: "Weekly" },
  { icon: "chat", label: "Assistant" },
  { icon: "users", label: "Groups" },
  { icon: "flow", label: "Flowcharts" },
];

// Which row is spotlighted, and the tooltip copy for it
const beats = [
  { row: 1, step: 2, title: "Create a study kit", body: "PDF, notes or a video link — in, and it's a kit." },
  { row: 3, step: 4, title: "Focus timer", body: "Pomodoro sessions that earn you XP." },
  { row: 6, step: 7, title: "Study groups", body: "Compete with friends on the leaderboard." },
];

export const SceneTour: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const beatLen = 36;
  const start = 26;
  const idx = Math.max(0, Math.min(beats.length - 1, Math.floor((frame - start) / beatLen)));
  const beat = beats[idx]!;

  const panel = spring({ frame: frame - 12, fps, config: { damping: 18, stiffness: 130 } });
  const tip = spring({ frame: frame - start - idx * beatLen, fps, config: { damping: 16, stiffness: 150 } });

  const rowH = 74;
  const spotY = beat.row * rowH;

  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: "0 120px" }}>
      <Eyebrow delay={0}>Step 06</Eyebrow>
      <div style={{ height: 20 }} />
      <Title delay={4} size={72}>
        A guided tour, built in.
      </Title>

      <div style={{ display: "flex", gap: 48, marginTop: 44, alignItems: "flex-start" }}>
        {/* Faux sidebar */}
        <div
          style={{
            ...glass,
            padding: 22,
            width: 360,
            opacity: interpolate(panel, [0, 1], [0, 1]),
            transform: `translateX(${interpolate(panel, [0, 1], [-40, 0])}px)`,
            position: "relative",
          }}
        >
          {rows.map((r) => (
            <div
              key={r.label}
              style={{
                height: rowH - 12,
                marginBottom: 12,
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "0 18px",
                fontFamily: body,
                fontSize: 26,
                color: C.text,
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <Icon name={r.icon} size={26} color={C.purpleSoft} />
              {r.label}
            </div>
          ))}

          {/* Spotlight ring that travels between rows */}
          <div
            style={{
              position: "absolute",
              left: 14,
              top: 14 + spotY,
              width: 332,
              height: rowH - 8,
              borderRadius: 18,
              border: `2px solid ${C.purpleSoft}`,
              boxShadow: `0 0 0 6px ${C.purple}33, 0 0 40px ${C.purple}66`,
              opacity: interpolate(panel, [0, 1], [0, 1]),
            }}
          />
        </div>

        {/* Tooltip card */}
        <div
          style={{
            ...glass,
            padding: 34,
            width: 620,
            marginTop: spotY * 0.55,
            opacity: interpolate(tip, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(tip, [0, 1], [26, 0])}px)`,
            borderTop: `1px solid ${C.mint}55`,
          }}
        >
          <div
            style={{
              fontFamily: body,
              fontSize: 20,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: C.mint,
              fontWeight: 700,
            }}
          >
            Step {beat.step} of 13
          </div>
          <div style={{ fontFamily: display, fontWeight: 800, fontSize: 42, color: C.text, marginTop: 12 }}>
            {beat.title}
          </div>
          <div style={{ fontFamily: body, fontSize: 26, color: C.muted, marginTop: 12, lineHeight: 1.4 }}>
            {beat.body}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 26 }}>
            {Array.from({ length: 13 }).map((_, i) => (
              <span
                key={i}
                style={{
                  height: 8,
                  width: i === beat.step - 1 ? 30 : 8,
                  borderRadius: 999,
                  background: i === beat.step - 1 ? C.purpleSoft : "rgba(255,255,255,0.16)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
