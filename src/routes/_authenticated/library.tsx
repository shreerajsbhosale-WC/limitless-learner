import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Library, Trash2, FileText, Loader2, Plus } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { listStudyKits, deleteStudyKit } from "@/lib/library.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({ meta: [{ title: "My library — Limitless" }] }),
  component: LibraryPage,
});

function LibraryPage() {
  const list = useServerFn(listStudyKits);
  const del = useServerFn(deleteStudyKit);
  const qc = useQueryClient();

  const { data: kits, isLoading } = useQuery({
    queryKey: ["kits"],
    queryFn: () => list(),
  });

  const remove = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kits"] });
      toast.success("Kit deleted");
    },
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
              <Library className="size-4" /> Your library
            </p>
            <h1 className="font-display text-4xl font-bold">Saved study kits</h1>
          </div>
          <Button asChild className="bg-gradient-primary text-primary-foreground">
            <Link to="/study"><Plus className="size-4 mr-2" />New kit</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid place-items-center py-20"><Loader2 className="size-6 animate-spin text-primary" /></div>
        ) : !kits?.length ? (
          <div className="rounded-2xl border border-dashed border-border p-16 text-center">
            <FileText className="size-10 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No saved kits yet. Generate one and tap save to keep it here.</p>
            <Button asChild className="bg-gradient-primary text-primary-foreground">
              <Link to="/study">Create your first kit</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {kits.map((k) => (
              <div key={k.id} className="rounded-2xl border border-border bg-gradient-card p-5 hover:border-primary/40 transition group">
                <div className="flex items-start justify-between gap-3">
                  <Link to="/library/$kitId" params={{ kitId: k.id }} className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-widest text-primary mb-1">{k.source_type}</p>
                    <h3 className="font-display text-lg font-semibold mb-1 truncate">{k.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {new Date(k.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm("Delete this kit?")) remove.mutate(k.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
