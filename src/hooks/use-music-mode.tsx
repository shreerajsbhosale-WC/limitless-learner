import { useCallback, useEffect, useState } from "react";

const KEY = "limitless-music-mode";

export function useMusicMode() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" && localStorage.getItem(KEY) === "1";
    setEnabled(stored);
    document.documentElement.classList.toggle("music", stored);
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("music", next);
      try {
        localStorage.setItem(KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  }, []);

  return { enabled, toggle };
}
