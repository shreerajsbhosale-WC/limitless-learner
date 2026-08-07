import { AbsoluteFill } from "remotion";
import { C, body, display } from "../theme";
import { Eyebrow, Title, Sub, Card, IconBadge } from "../components/Bits";

const items = [
  { icon: "notes", title: "Notes", body: "Structured sections you can skim or study.", accent: C.purple },
  { icon: "brain", title: "Flashcards", body: "Dozens of Q&A cards, ready to flip.", accent: C.mint },
  { icon: "bolt", title: "Practice tests", body: "Quizzes with explanations for every miss.", accent: C.purple },
];

export const SceneKit: React.FC = () => (
  <AbsoluteFill style={{ justifyContent: "center", padding: "0 130px" }}>
    <Eyebrow delay={0}>Step 02</Eyebrow>
    <div style={{ height: 24 }} />
    <Title delay={5} size={82}>
      One upload. A full study kit.
    </Title>
    <div style={{ height: 20 }} />
    <Sub delay={12}>Limitless covers 100% of the topic — not just a summary.</Sub>

    <div style={{ display: "flex", gap: 26, marginTop: 52 }}>
      {items.map((it, i) => (
        <Card key={it.title} delay={26 + i * 10} accent={it.accent} style={{ flex: 1 }}>
          <IconBadge name={it.icon} accent={it.accent} />
          <div style={{ fontFamily: display, fontWeight: 700, fontSize: 40, color: C.text, marginTop: 24 }}>
            {it.title}
          </div>
          <div style={{ fontFamily: body, fontSize: 25, color: C.muted, marginTop: 12, lineHeight: 1.4 }}>
            {it.body}
          </div>
        </Card>
      ))}
    </div>
  </AbsoluteFill>
);
