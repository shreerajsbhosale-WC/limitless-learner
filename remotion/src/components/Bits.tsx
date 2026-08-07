import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { C, display, body, glass } from "../theme";
import { Icon } from "./Icon";

export const useRise = (delay: number, damping = 18) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping, stiffness: 140 } });
  return {
    opacity: interpolate(s, [0, 1], [0, 1]),
    transform: `translateY(${interpolate(s, [0, 1], [42, 0])}px)`,
  };
};

export const Eyebrow: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  const st = useRise(delay);
  return (
    <div
      style={{
        ...st,
        ...glass,
        width: "fit-content",
        alignSelf: "flex-start",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 22px",
        borderRadius: 999,
        fontFamily: body,
        fontSize: 22,
        letterSpacing: 3,
        textTransform: "uppercase",
        color: C.purpleSoft,
        fontWeight: 600,
      }}
    >
      <span style={{ width: 10, height: 10, borderRadius: 999, background: C.mint }} />
      {children}
    </div>
  );
};

export const Title: React.FC<{ children: React.ReactNode; delay?: number; size?: number }> = ({
  children,
  delay = 0,
  size = 96,
}) => {
  const st = useRise(delay, 22);
  return (
    <h1
      style={{
        ...st,
        fontFamily: display,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1.02,
        letterSpacing: -2.5,
        color: C.text,
        margin: 0,
      }}
    >
      {children}
    </h1>
  );
};

export const Sub: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  const st = useRise(delay);
  return (
    <p
      style={{
        ...st,
        fontFamily: body,
        fontSize: 30,
        lineHeight: 1.45,
        color: C.muted,
        margin: 0,
        maxWidth: 760,
      }}
    >
      {children}
    </p>
  );
};

export const Card: React.FC<{
  delay?: number;
  children: React.ReactNode;
  accent?: string;
  style?: React.CSSProperties;
}> = ({ delay = 0, children, accent = C.purple, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 130 } });
  const float = Math.sin((frame - delay) / 34) * 6;
  return (
    <div
      style={{
        ...glass,
        padding: 30,
        opacity: interpolate(s, [0, 1], [0, 1]),
        transform: `translateY(${interpolate(s, [0, 1], [56, float])}px) scale(${interpolate(s, [0, 1], [0.94, 1])})`,
        boxShadow: `0 30px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)`,
        borderTop: `1px solid ${accent}55`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const IconBadge: React.FC<{ name: string; accent?: string; size?: number }> = ({
  name,
  accent = C.purple,
  size = 68,
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.29,
      background: `${accent}26`,
      border: `1px solid ${accent}55`,
      display: "grid",
      placeItems: "center",
      flexShrink: 0,
    }}
  >
    <Icon name={name} size={size * 0.48} color={accent === C.mint ? C.mint : C.purpleSoft} />
  </div>
);

export const Pill: React.FC<{ label: string; icon: string; delay: number; accent?: string }> = ({
  label,
  icon,
  delay,
  accent = C.purple,
}) => {
  const st = useRise(delay, 14);
  return (
    <div
      style={{
        ...st,
        ...glass,
        borderRadius: 20,
        padding: "20px 26px",
        display: "flex",
        alignItems: "center",
        gap: 20,
        fontFamily: body,
        fontSize: 30,
        fontWeight: 600,
        color: C.text,
      }}
    >
      <IconBadge name={icon} accent={accent} size={56} />
      {label}
    </div>
  );
};
