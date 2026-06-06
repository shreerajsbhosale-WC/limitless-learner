import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Layers, BrainCircuit, Zap } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Notes } from "@/components/Notes";
import { Flashcards } from "@/components/Flashcards";
import { Quiz } from "@/components/Quiz";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { KitSkeleton } from "@/components/Skeletons";
import { getStudyKit } from "@/lib/library.functions";
import type { StudyMaterials } from "@/lib/study.functions";

export const Route = createFileRoute("/_authenticated/library/$kitId")({
  component: KitPage,
});

function KitPage() {
  const { kitId } = Route.useParams();
  const fetchKit = useServerFn(getStudyKit);
  const { data, isLoading } = useQuery({
    queryKey: ["kit", kitId],
    queryFn: () => fetchKit({ data: { id: kitId } }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-5xl px-6 py-10">
          <Breadcrumbs items={[{ label: "Library", to: "/library" }, { label: "Loading…" }]} />
          <KitSkeleton />
        </main>
      </div>
    );
  }
  if (!data) return null;
  const materials = data.materials as unknown as StudyMaterials;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Breadcrumbs items={[{ label: "Library", to: "/library" }, { label: data.title }]} />
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/library"><ArrowLeft className="size-4 mr-2" />Library</Link>
        </Button>
        <header className="mb-8">
          <p className="text-xs uppercase tracking-widest text-primary mb-2">Saved kit</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">{data.title}</h1>
        </header>
        <Tabs defaultValue="notes">
          <TabsList className="grid grid-cols-3 max-w-md mb-8 bg-secondary">

            <TabsTrigger value="notes" className="gap-2"><Layers className="size-4" /> Notes</TabsTrigger>
            <TabsTrigger value="cards" className="gap-2"><BrainCircuit className="size-4" /> Cards</TabsTrigger>
            <TabsTrigger value="quiz" className="gap-2"><Zap className="size-4" /> Quiz</TabsTrigger>
          </TabsList>
          <TabsContent value="notes"><Notes notes={materials.notes} summary={materials.summary} /></TabsContent>
          <TabsContent value="cards"><Flashcards cards={materials.flashcards} /></TabsContent>
          <TabsContent value="quiz"><Quiz questions={materials.quiz} topic={materials.title} /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
