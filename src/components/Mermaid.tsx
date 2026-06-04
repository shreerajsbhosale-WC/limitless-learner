import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
  fontFamily: "Inter, sans-serif",
});

export function Mermaid({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ref.current || !chart) return;
    const id = `m-${Math.random().toString(36).slice(2)}`;
    setError(null);
    mermaid
      .render(id, chart)
      .then(({ svg }) => {
        if (ref.current) ref.current.innerHTML = svg;
      })
      .catch((e) => setError(e?.message ?? "Failed to render diagram"));
  }, [chart]);

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
        <p className="font-medium text-destructive mb-2">Couldn't render diagram</p>
        <pre className="text-xs whitespace-pre-wrap text-muted-foreground">{error}</pre>
        <pre className="text-xs whitespace-pre-wrap mt-2 opacity-60">{chart}</pre>
      </div>
    );
  }
  return <div ref={ref} className="mermaid-container overflow-auto rounded-2xl border border-border bg-gradient-card p-6 [&_svg]:mx-auto [&_svg]:max-w-full" />;
}
