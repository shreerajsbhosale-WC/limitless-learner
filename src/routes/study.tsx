import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Layers, BrainCircuit, Zap, RefreshCw } from "lucide-react";

import { SiteHeader } from "@/components/SiteHeader";
import { PdfDropzone } from "@/components/PdfDropzone";
import { Notes } from "@/components/Notes";
import { Flashcards } from "@/components/Flashcards";
import { Quiz } from "@/components/Quiz";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { extractPdfText } from "@/lib/pdf";
import { generateStudyMaterials, type StudyMaterials } from "@/lib/study.functions";
import { useAnimeMode } from "@/hooks/use-anime-mode";
import { useMusicMode } from "@/hooks/use-music-mode";


export const Route = createFileRoute("/study")({
  head: () => ({
    meta: [
      { title: "Study — Limitless" },
      { name: "description", content: "Upload a PDF and generate notes, flashcards, and quizzes with Limitless." },
    ],
  }),
  component: StudyPage,
});

function StudyPage() {
  const generate = useServerFn(generateStudyMaterials);
  const { enabled: animeMode } = useAnimeMode();
  const { enabled: musicMode } = useMusicMode();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>();
  const [error, setError] = useState<string | null>(null);
  const [materials, setMaterials] = useState<StudyMaterials | null>(null);

  const handleFile = async (file: File) => {
    setBusy(true);
    setError(null);
    setMaterials(null);
    try {
      setStatus("Reading your PDF…");
      const text = await extractPdfText(file);
      if (text.length < 100) {
        throw new Error("Couldn't extract enough text from this PDF. Try a text-based PDF (not a scanned image).");
      }
      setStatus(
        musicMode
          ? "Tuning your study kit…"
          : animeMode
            ? "Powering up your study kit…"
            : "Crafting your study kit…",
      );
      // Limit text to ~80k chars
      const trimmed = text.length > 80_000 ? text.slice(0, 80_000) : text;
      const result = await generate({
        data: { text: trimmed, title: file.name.replace(/\.pdf$/i, ""), animeMode, musicMode },
      });
      setMaterials(result);

    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setError(msg);
    } finally {
      setBusy(false);
      setStatus(undefined);
    }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <ArrowLeft className="size-4 mr-2" /> Home
            </Link>
          </Button>
          {materials && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMaterials(null);
                setError(null);
              }}
            >
              <RefreshCw className="size-4 mr-2" /> New PDF
            </Button>
          )}
        </div>

        {!materials && (
          <div className="max-w-2xl mx-auto">
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-center mb-3">
              Upload a PDF
            </h1>
            <p className="text-center text-muted-foreground mb-8">
              We'll turn it into notes, flashcards, and a practice quiz.
            </p>
            <PdfDropzone onFile={handleFile} busy={busy} status={status} />
            {error && (
              <p className="mt-4 text-sm text-destructive text-center">{error}</p>
            )}
          </div>
        )}

        {materials && (
          <div>
            <header className="mb-8">
              <p className="text-xs uppercase tracking-widest text-primary mb-2">Your study kit</p>
              <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
                {materials.title}
              </h1>
            </header>

            <Tabs defaultValue="notes" className="w-full">
              <TabsList className="grid grid-cols-3 max-w-md mb-8 bg-secondary">
                <TabsTrigger value="notes" className="gap-2">
                  <Layers className="size-4" /> Notes
                </TabsTrigger>
                <TabsTrigger value="cards" className="gap-2">
                  <BrainCircuit className="size-4" /> Cards
                </TabsTrigger>
                <TabsTrigger value="quiz" className="gap-2">
                  <Zap className="size-4" /> Quiz
                </TabsTrigger>
              </TabsList>

              <TabsContent value="notes">
                <Notes notes={materials.notes} summary={materials.summary} />
              </TabsContent>
              <TabsContent value="cards">
                <Flashcards cards={materials.flashcards} />
              </TabsContent>
              <TabsContent value="quiz">
                <Quiz questions={materials.quiz} topic={materials.title} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
}
