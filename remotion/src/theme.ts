import { loadFont as loadDisplay } from "@remotion/google-fonts/PlusJakartaSans";
import { loadFont as loadBody } from "@remotion/google-fonts/Inter";

export const display = loadDisplay("normal", {
  weights: ["700", "800"],
  subsets: ["latin"],
}).fontFamily;

export const body = loadBody("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
}).fontFamily;

export const C = {
  bg: "#0B1020",
  bg2: "#141B33",
  purple: "#7C5CFC",
  purpleSoft: "#A78BFA",
  mint: "#4ADE9B",
  text: "#EEF1FA",
  muted: "#9AA3BF",
  line: "rgba(255,255,255,0.10)",
  glass: "rgba(255,255,255,0.055)",
};

export const glass = {
  background: C.glass,
  border: `1px solid ${C.line}`,
  borderRadius: 24,
} as const;
