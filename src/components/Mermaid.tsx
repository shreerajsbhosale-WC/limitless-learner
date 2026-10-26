import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
  fontFamily: "Inter, sans-serif",
  themeVariables: { fontSize: "20px" },
  flowchart: { useMaxWidth: false, padding: 16 },
  sequence: { useMaxWidth: false },
  mindmap: { useMaxWidth: false },
});

export function Mermaid({ chart }: { chart: string }) {
  const inner = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!inner.current || !chart) return;
    const id = `m-${Math.random().toString(36).slice(2)}`;
    setError(null);
    setZoom(1);
    mermaid
      .render(id, chart)
      .then(({ svg }) => {
        if (inner.current) inner.current.innerHTML = svg;
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

  return (
    <div>
      <div className="mb-2 flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          aria-label="Zoom out"
          onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
        >
          <Minus className="size-4" />
        </Button>
        <span className="text-xs text-muted-foreground w-12 text-center">{Math.round(zoom * 100)}%</span>
        <Button
          variant="outline"
          size="sm"
          aria-label="Zoom in"
          onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.25).toFixed(2)))}
        >
          <Plus className="size-4" />
        </Button>
      </div>
      <div className="overflow-auto rounded-2xl border border-border bg-gradient-card p-6 max-h-[70vh]">
        <div
          ref={inner}
          className="min-w-max flex justify-center [&_svg]:max-w-none"
          style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
        />
      </div>
    </div>
  );
}
