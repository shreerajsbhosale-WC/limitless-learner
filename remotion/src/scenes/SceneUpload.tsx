import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { C, body, glass } from "../theme";
import { Eyebrow, Title, Sub, Pill, IconBadge } from "../components/Bits";

export const SceneUpload: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const drop = spring({ frame: frame - 40, fps, config: { damping: 12, stiffness: 120 } });
  const scan = interpolate(frame, [70, 130], [0, 100], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", padding: "0 130px", gap: 90 }}>
      <div style={{ flex: 1 }}>
        <Eyebrow delay={0}>Step 01</Eyebrow>
        <div style={{ height: 28 }} />
        <Title delay={6} size={86}>
          Bring anything
          <br />
          you need to learn.
        </Title>
        <div style={{ height: 26 }} />
        <Sub delay={16}>A PDF, your own notes, or a video link — Limitless reads it all.</Sub>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 40, maxWidth: 520 }}>
          <Pill icon="file" label="Upload a PDF" delay={28} />
          <Pill icon="pen" label="Paste your own text" delay={38} accent={C.mint} />
          <Pill icon="video" label="Drop a video link" delay={48} />
        </div>
      </div>

      <div style={{ width: 620, position: "relative" }}>
        <div
          style={{
            ...glass,
            padding: 34,
            height: 470,
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 40px 100px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ display: "flex", gap: 9, marginBottom: 30 }}>
            {["#F87171", "#FBBF24", C.mint].map((c) => (
              <div key={c} style={{ width: 13, height: 13, borderRadius: 99, background: `${c}88` }} />
            ))}
          </div>
          <div
            style={{
              border: `2px dashed ${C.purple}88`,
              borderRadius: 22,
              height: 300,
              display: "grid",
              placeItems: "center",
              fontFamily: body,
              color: C.muted,
              fontSize: 26,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ textAlign: "center", transform: `translateY(${interpolate(drop, [0, 1], [-140, 0])}px)` }}>
              <div style={{ display: "flex", justifyContent: "center" }}><IconBadge name="file" size={92} /></div>
              <div style={{ marginTop: 14, color: C.text, fontWeight: 600 }}>Lecture_Notes.pdf</div>
            </div>
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: `${scan}%`,
                height: 3,
                background: `linear-gradient(90deg, transparent, ${C.mint}, transparent)`,
                opacity: scan > 0 && scan < 100 ? 1 : 0,
              }}
            />
          </div>
          <div style={{ marginTop: 26, height: 10, borderRadius: 99, background: "rgba(255,255,255,0.08)" }}>
            <div
              style={{
                height: "100%",
                width: `${scan}%`,
                borderRadius: 99,
                background: `linear-gradient(90deg, ${C.purple}, ${C.mint})`,
              }}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
