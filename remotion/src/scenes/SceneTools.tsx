import { AbsoluteFill } from "remotion";
import { C, body, display } from "../theme";
import { Eyebrow, Title, Card, IconBadge } from "../components/Bits";

const tools = [
  { icon: "chat", title: "AI Assistant", body: "Ask anything, anytime." },
  { icon: "leaf", title: "Habits", body: "Daily streaks that stick." },
  { icon: "timer", title: "Focus timer", body: "Pomodoro that earns XP." },
  { icon: "flow", title: "Flowcharts", body: "See ideas connect." },
  { icon: "users", title: "Study groups", body: "Climb the leaderboard." },
  { icon: "chart", title: "Weekly report", body: "Know what worked." },
];

export const SceneTools: React.FC = () => (
  <AbsoluteFill style={{ justifyContent: "center", padding: "0 120px" }}>
    <Eyebrow delay={0}>Step 03</Eyebrow>
    <div style={{ height: 22 }} />
    <Title delay={5} size={76}>
      The rest of your study life, handled.
    </Title>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22, marginTop: 46 }}>
      {tools.map((t, i) => (
        <Card key={t.title} delay={22 + i * 7} accent={i % 2 ? C.mint : C.purple} style={{ padding: 26 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <IconBadge name={t.icon} accent={i % 2 ? C.mint : C.purple} size={54} />
            <span style={{ fontFamily: display, fontWeight: 700, fontSize: 34, color: C.text }}>{t.title}</span>
          </div>
          <div style={{ fontFamily: body, fontSize: 24, color: C.muted, marginTop: 12 }}>{t.body}</div>
        </Card>
      ))}
    </div>
  </AbsoluteFill>
);
