import { useEffect, useState } from "react";

const KEY = "limitless-exam-mode";

export function useExamMode() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    setEnabled(localStorage.getItem(KEY) === "1");
  }, []);
  const toggle = () => {
    setEnabled((v) => {
      const next = !v;
      try { localStorage.setItem(KEY, next ? "1" : "0"); } catch {}
      return next;
    });
  };
  return { enabled, toggle };
}
