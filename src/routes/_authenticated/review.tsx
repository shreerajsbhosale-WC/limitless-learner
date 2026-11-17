import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, CircleAlert, Clock3, FileText, ListChecks, Loader2, Shield, ShieldCheck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getReviewerAccess, listOverrideAudit, listReviewQueue, listScreeningHistory, decideScreeningAppeal } from "@/lib/screening.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/review")({
  head: () => ({
    meta: [
      { title: "Security review — Limitless" },
      { name: "description", content: "Review flagged study material appeals and inspect the screening audit log." },
      { property: "og:title", content: "Security review — Limitless" },
      { property: "og:description", content: "A private queue for reviewing flagged study material." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReviewPage,
});

function ReviewPage() {
  const checkAccess = useServerFn(getReviewerAccess);
  const listQueue = useServerFn(listReviewQueue);
  const listHistory = useServerFn(listScreeningHistory);
  const listAudit = useServerFn(listOverrideAudit);
  const decide = useServerFn(decideScreeningAppeal);
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const { data: access, isLoading } = useQuery({ queryKey: ["reviewer-access"], queryFn: () => checkAccess() });
  const { data: queue = [], isLoading: queueLoading } = useQuery({ queryKey: ["screening-queue"], queryFn: () => listQueue(), enabled: access?.allowed === true });
  const { data: history = [], isLoading: historyLoading } = useQuery({ queryKey: ["screening-history"], queryFn: () => listHistory(), enabled: access?.allowed === true });
  const { data: audit, isLoading: auditLoading } = useQuery({ queryKey: ["screening-audit"], queryFn: () => listAudit(), enabled: access?.allowed === true });
  const decision = useMutation({
    mutationFn: (input: { caseId: string; decision: "approve" | "deny" }) => decide({ data: { ...input, note: notes[input.caseId] ?? "" } }),
    onSuccess: async (result) => {
      if (result.status !== "approved" && result.status !== "denied") {
        toast.error("That appeal has already changed state.");
        return;
      }
      toast.success(result.status === "approved" ? "Appeal approved" : "Appeal declined");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["screening-queue"] }),
        queryClient.invalidateQueries({ queryKey: ["screening-history"] }),
        queryClient.invalidateQueries({ queryKey: ["screening-audit"] }),
      ]);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not save the review decision."),
  });

  if (isLoading) return <main className="flex-1 grid place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></main>;
  if (!access?.allowed) return (
    <main className="flex-1 grid place-items-center px-5 py-16">
      <div className="max-w-md text-center">
        <Shield className="mx-auto size-10 text-primary mb-4" />
        <h1 className="font-display text-2xl font-bold">Reviewer access required</h1>
        <p className="mt-2 text-muted-foreground">This page is only available to approved Limitless reviewers.</p>
      </div>
    </main>
  );

  return (
    <main className="flex-1 min-w-0">
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-9">
        <div className="mb-7 flex items-start gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><ShieldCheck className="size-5" /></div>
          <div>
            <p className="text-xs uppercase text-primary mb-1">Private workspace</p>
            <h1 className="font-display text-3xl font-bold">Security review</h1>
            <p className="mt-1 text-sm text-muted-foreground">Flagged study sources, appeals, and append-only activity.</p>
          </div>
        </div>

        <Tabs defaultValue="appeals">
          <TabsList className="mb-6 w-full justify-start overflow-x-auto">
            <TabsTrigger value="appeals" className="gap-2"><ListChecks className="size-4" /> Appeals <span className="rounded bg-primary/10 px-1.5 text-xs">{queue.length}</span></TabsTrigger>
            <TabsTrigger value="screenings" className="gap-2"><FileText className="size-4" /> Screenings</TabsTrigger>
            <TabsTrigger value="audit" className="gap-2"><Clock3 className="size-4" /> Audit log</TabsTrigger>
          </TabsList>

          <TabsContent value="appeals" className="space-y-4">
            {queueLoading ? <Loading /> : queue.length === 0 ? <EmptyState title="No appeals waiting" body="New appeals will appear here for review." /> : queue.map((item) => (
              <section key={item.id} className="rounded-lg border border-border bg-card/60 p-4 md:p-5">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant="secondary">{item.kind.toUpperCase()}</Badge>
                  <Badge variant="outline">{item.mode}</Badge>
                  <span className="ml-auto text-xs text-muted-foreground">{item.appealed_at ? new Date(item.appealed_at).toLocaleString() : "Appeal date unavailable"}</span>
                </div>
                <p className="text-sm font-medium break-all">Learner ID: {item.user_id}</p>
                <p className="mt-3 whitespace-pre-wrap break-words rounded-md bg-muted/40 p-3 text-sm">{item.excerpt || "No excerpt available."}</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div><p className="text-xs font-semibold text-muted-foreground mb-1">Screening signals</p><p className="text-sm break-words">{item.internal_reasons.join(", ") || "No signal details"}</p></div>
                  <div><p className="text-xs font-semibold text-muted-foreground mb-1">Learner’s note</p><p className="text-sm break-words">{item.justification || "No appeal note"}</p></div>
                </div>
                <Textarea className="mt-4 min-h-16" maxLength={500} placeholder="Optional decision note" value={notes[item.id] ?? ""} onChange={(event) => setNotes((old) => ({ ...old, [item.id]: event.target.value }))} />
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  <Button variant="outline" onClick={() => decision.mutate({ caseId: item.id, decision: "deny" })} disabled={decision.isPending}><X className="mr-2 size-4" />Decline</Button>
                  <Button onClick={() => decision.mutate({ caseId: item.id, decision: "approve" })} disabled={decision.isPending}><Check className="mr-2 size-4" />Approve</Button>
                </div>
              </section>
            ))}
          </TabsContent>

          <TabsContent value="screenings" className="space-y-3">
            {historyLoading ? <Loading /> : history.length === 0 ? <EmptyState title="No flagged uploads yet" body="Blocked and reviewable sources will appear here." /> : history.map((item) => (
              <section key={item.id} className="grid gap-3 rounded-lg border border-border bg-card/60 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2"><Badge variant="secondary">{item.kind.toUpperCase()}</Badge><Badge variant={item.status === "blocked" || item.status === "denied" ? "destructive" : "outline"}>{item.status.replaceAll("_", " ")}</Badge><span className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</span></div>
                  <p className="text-sm break-words">{item.excerpt || "No excerpt available."}</p>
                  <p className="mt-1 text-xs text-muted-foreground break-all">{item.internal_reasons.join(", ") || "No signal details"}</p>
                </div>
                <p className="text-xs text-muted-foreground">{item.user_id}</p>
              </section>
            ))}
          </TabsContent>

          <TabsContent value="audit">
            {auditLoading ? <Loading /> : <>
              <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border p-4">
                {audit?.integrity.ok ? <ShieldCheck className="size-5 text-primary" /> : <CircleAlert className="size-5 text-destructive" />}
                <p className="text-sm">{audit?.integrity.ok ? `Audit chain verified · ${audit.integrity.entries ?? 0} records` : `Audit integrity issue at record ${audit?.integrity.brokenAt ?? "unknown"}`}</p>
              </div>
              {!audit?.entries.length ? <EmptyState title="No audit entries" body="Screening and reviewer decisions are recorded here." /> : <div className="space-y-2">
                {audit.entries.map((entry) => <article key={entry.seq} className="grid gap-2 rounded-md border border-border/70 p-3 text-sm md:grid-cols-[100px_180px_minmax(0,1fr)_auto] md:items-center">
                  <span className="font-mono text-xs text-muted-foreground">#{entry.seq}</span>
                  <Badge variant="outline" className="w-fit">{entry.type.replaceAll("_", " ")}</Badge>
                  <span className="break-all text-muted-foreground">{entry.case_id || "System event"}</span>
                  <time className="text-xs text-muted-foreground">{new Date(entry.ts).toLocaleString()}</time>
                </article>)}
              </div>}
            </>}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function Loading() {
  return <div className="grid place-items-center py-16"><Loader2 className="size-6 animate-spin text-primary" /></div>;
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return <div className="rounded-lg border border-dashed border-border py-14 text-center"><p className="font-medium">{title}</p><p className="mt-1 text-sm text-muted-foreground">{body}</p></div>;
}