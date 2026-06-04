import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Workflow, Loader2, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mermaid } from "@/components/Mermaid";
import { generateFlowchart } from "@/lib/library.functions";
import { PdfDropzone } from "@/components/PdfDropzone";
import { extractPdfText } from "@/lib/pdf";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/flowchart")({
  head: () => ({ meta: [{ title: "Flowcharts — Limitless" }] }),
  component: FlowchartPage,
});

function FlowchartPage() {
  const gen = useServerFn(generateFlowchart);
  const [content, setContent] = useState("");
  const [style, setStyle] = useState<"flowchart" | "mindmap" | "sequence">("flowchart");
  const [diagram, setDiagram] = useState("");
  const [busy, setBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  const generate = async (text?: string) => {
    const body = (text ?? content).trim();
    if (body.length < 20) {
      toast.error("Add more content (at least 20 characters).");
      return;
    }
    setBusy(true);
    try {
      const res = await gen({ data: { content: body.slice(0, 40_000), style } });
      setDiagram(res.diagram);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const handlePdf = async (file: File) => {
    setPdfBusy(true);
    try {
      const text = await extractPdfText(file);
      setContent(text.slice(0, 40_000));
      await generate(text);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "PDF failed");
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
            <Workflow className="size-3.5" /> Visualize
          </p>
          <h1 className="font-display text-4xl font-bold">Flowchart generator</h1>
          <p className="text-muted-foreground mt-2">Turn any text, notes, or PDF into a clean diagram.</p>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Tabs value={style} onValueChange={(v) => setStyle(v as typeof style)}>
              <TabsList className="grid grid-cols-3 bg-secondary">
                <TabsTrigger value="flowchart">Flowchart</TabsTrigger>
                <TabsTrigger value="mindmap">Mind map</TabsTrigger>
                <TabsTrigger value="sequence">Sequence</TabsTrigger>
              </TabsList>
            </Tabs>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste content, an outline, a process description, or notes…"
              className="min-h-[260px]"
            />
            <Button onClick={() => generate()} disabled={busy} className="w-full bg-gradient-primary text-primary-foreground h-11">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <><Sparkles className="size-4 mr-2" />Generate diagram</>}
            </Button>
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-2">…or upload a PDF</p>
              <PdfDropzone onFile={handlePdf} busy={pdfBusy} status="Building diagram…" />
            </div>
          </div>

          <div>
            {diagram ? (
              <Mermaid chart={diagram} />
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-16 text-center text-muted-foreground h-full grid place-items-center">
                <div>
                  <Workflow className="size-10 mx-auto mb-3 text-primary" />
                  <p>Your diagram will appear here.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
