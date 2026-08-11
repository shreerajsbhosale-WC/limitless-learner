import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Layers, BrainCircuit, Zap, RefreshCw, FileUp, Type, Video, Loader2, Save, Shuffle, Swords } from "lucide-react";

import { SiteHeader } from "@/components/SiteHeader";
import { PdfDropzone } from "@/components/PdfDropzone";
import { Notes } from "@/components/Notes";
import { Flashcards } from "@/components/Flashcards";
import { Quiz } from "@/components/Quiz";
import { MatchGame } from "@/components/MatchGame";
import { StoryMode } from "@/components/StoryMode";
import { Breadcrumbs } from "@/components/Breadcrumbs";


import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { extractPdfText } from "@/lib/pdf";
import { generateStudyMaterials, fetchVideoMeta, type StudyMaterials } from "@/lib/study.functions";
import { saveStudyKit } from "@/lib/library.functions";
import { useMusicMode } from "@/hooks/use-music-mode";
import { useProgress } from "@/hooks/use-progress";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/study")({
  head: () => ({
    meta: [
      { title: "Study — Limitless" },
      { name: "description", content: "Upload a PDF, paste text, or drop a video link to generate notes, flashcards, and quizzes." },
    ],
  }),
  component: StudyPage,
});

function StudyPage() {
  const generate = useServerFn(generateStudyMaterials);
  const fetchVideo = useServerFn(fetchVideoMeta);
  const saveKit = useServerFn(saveStudyKit);
  const animeMode = false;
  const { enabled: musicMode } = useMusicMode();
  const { recordKitGenerated } = useProgress();
  const { user } = useAuth();

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>();
  const [error, setError] = useState<string | null>(null);
  const [materials, setMaterials] = useState<StudyMaterials | null>(null);
  const [sourceType, setSourceType] = useState<"pdf" | "text" | "video">("pdf");
  const [textInput, setTextInput] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [saved, setSaved] = useState(false);
  const [sourceText, setSourceText] = useState("");

  const runGenerate = async (text: string, title: string, sourceLabel?: string) => {
    setStatus(musicMode ? "Tuning your study kit…" : animeMode ? "Powering up your study kit…" : "Crafting your study kit…");
    const trimmed = text.length > 80_000 ? text.slice(0, 80_000) : text;
    setSourceText(trimmed);
    const result = await generate({
      data: { text: trimmed, title, animeMode, musicMode, sourceLabel },
    });

    setMaterials(result);
    recordKitGenerated();
    setSaved(false);
  };

  const handleFile = async (file: File) => {
    setBusy(true); setError(null); setMaterials(null);
    try {
      setStatus("Reading your PDF…");
      const text = await extractPdfText(file);
      if (text.length < 100) throw new Error("Couldn't extract enough text. Try a text-based PDF.");
      await runGenerate(text, file.name.replace(/\.pdf$/i, ""), `PDF: ${file.name}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false); setStatus(undefined);
    }
  };

  const handleText = async () => {
    if (textInput.trim().length < 50) { toast.error("Add at least a paragraph of text."); return; }
    setBusy(true); setError(null); setMaterials(null);
    try {
      await runGenerate(textInput, textInput.split(/\s+/).slice(0, 8).join(" "), "Personal notes");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false); setStatus(undefined);
    }
  };

  const handleVideo = async () => {
    if (!videoUrl.trim()) return;
    setBusy(true); setError(null); setMaterials(null);
    try {
      setStatus("Fetching video info…");
      const meta = await fetchVideo({ data: { url: videoUrl } });
      await runGenerate(meta.text, meta.title, `Video: ${videoUrl}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't process that video link.");
    } finally {
      setBusy(false); setStatus(undefined);
    }
  };

  const handleSave = async () => {
    if (!materials) return;
    if (!user) { toast.error("Sign in to save kits to your library."); return; }
    try {
      await saveKit({ data: { title: materials.title, sourceType, materials } });
      setSaved(true);
      toast.success("Saved to your library");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Breadcrumbs items={[{ label: materials ? materials.title : "Study" }]} />
        <div className="flex items-center justify-between mb-8">

          <Button asChild variant="ghost" size="sm">
            <Link to="/"><ArrowLeft className="size-4 mr-2" /> Home</Link>
          </Button>
          {materials && (
            <div className="flex gap-2">
              {user && (
                <Button variant="outline" size="sm" onClick={handleSave} disabled={saved}>
                  <Save className="size-4 mr-2" /> {saved ? "Saved" : "Save to library"}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => { setMaterials(null); setError(null); setSaved(false); }}>
                <RefreshCw className="size-4 mr-2" /> New
              </Button>
            </div>
          )}
        </div>

        {!materials && (
          <div className="max-w-2xl mx-auto">
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-center mb-3">
              Make a study kit
            </h1>
            <p className="text-center text-muted-foreground mb-8">
              From a PDF, your own notes, or a video link.
            </p>

            <Tabs value={sourceType} onValueChange={(v) => setSourceType(v as typeof sourceType)} className="mb-6">
              <TabsList className="grid grid-cols-3 bg-secondary">
                <TabsTrigger value="pdf" className="gap-2"><FileUp className="size-4" /> PDF</TabsTrigger>
                <TabsTrigger value="text" className="gap-2"><Type className="size-4" /> Text</TabsTrigger>
                <TabsTrigger value="video" className="gap-2"><Video className="size-4" /> Video link</TabsTrigger>
              </TabsList>
            </Tabs>

            {sourceType === "pdf" && <PdfDropzone onFile={handleFile} busy={busy} status={status} />}

            {sourceType === "text" && (
              <div className="space-y-3">
                <Textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Paste lecture notes, an article, a chapter, or your own writing…"
                  className="min-h-[260px]"
                  disabled={busy}
                />
                <Button onClick={handleText} disabled={busy} className="w-full bg-gradient-primary text-primary-foreground h-11">
                  {busy ? <><Loader2 className="size-4 mr-2 animate-spin" />{status}</> : "Generate study kit"}
                </Button>
              </div>
            )}

            {sourceType === "video" && (
              <div className="space-y-3">
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=…"
                  disabled={busy}
                  className="h-12"
                />
                <p className="text-xs text-muted-foreground">
                  We'll pull the video's title and topic and generate study material from it.
                </p>
                <Button onClick={handleVideo} disabled={busy || !videoUrl.trim()} className="w-full bg-gradient-primary text-primary-foreground h-11">
                  {busy ? <><Loader2 className="size-4 mr-2 animate-spin" />{status}</> : "Generate from video"}
                </Button>
              </div>
            )}

            {error && <p className="mt-4 text-sm text-destructive text-center">{error}</p>}

            {!user && (
              <div className="mt-6 rounded-xl border border-border bg-card/60 p-4 text-center text-sm text-muted-foreground">
                You're browsing as a <span className="text-foreground font-medium">guest</span> — upload a PDF, paste text, or drop a video link and everything works.
                Your kit just won't be saved when you leave.{" "}
                <Link to="/auth" className="text-primary hover:underline">Sign in</Link> to keep it in your library.
              </div>
            )}
          </div>
        )}

        {materials && (
          <div>
            <header className="mb-8">
              <p className="text-xs uppercase tracking-widest text-primary mb-2">Your study kit</p>
              <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">{materials.title}</h1>
              {!user && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Guest mode — this kit isn't saved.{" "}
                  <Link to="/auth" className="text-primary hover:underline">Sign in</Link> to save it to your library.
                </p>
              )}
            </header>
            <Tabs defaultValue="notes" className="w-full">
              <TabsList className="grid grid-cols-5 max-w-2xl mb-8 bg-secondary">
                <TabsTrigger value="notes" className="gap-2"><Layers className="size-4" /> Notes</TabsTrigger>
                <TabsTrigger value="cards" className="gap-2"><BrainCircuit className="size-4" /> Cards</TabsTrigger>
                <TabsTrigger value="match" className="gap-2"><Shuffle className="size-4" /> Match</TabsTrigger>
                <TabsTrigger value="story" className="gap-2"><Swords className="size-4" /> Story</TabsTrigger>
                <TabsTrigger value="quiz" className="gap-2"><Zap className="size-4" /> Quiz</TabsTrigger>
              </TabsList>
              <TabsContent value="notes"><Notes notes={materials.notes} summary={materials.summary} /></TabsContent>
              <TabsContent value="cards"><Flashcards cards={materials.flashcards} /></TabsContent>
              <TabsContent value="match"><MatchGame cards={materials.flashcards} /></TabsContent>
              <TabsContent value="story">
                <StoryMode
                  sourceText={sourceText || `${materials.summary}\n\n${materials.notes.map((n) => `${n.heading}\n${n.points.join("\n")}`).join("\n\n")}`}
                  title={materials.title}
                />
              </TabsContent>
              <TabsContent value="quiz"><Quiz questions={materials.quiz} topic={materials.title} /></TabsContent>

            </Tabs>

          </div>
        )}
      </main>
    </div>
  );
}
