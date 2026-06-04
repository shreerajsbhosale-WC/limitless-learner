import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Trash2, Loader2, Bot, User as UserIcon } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { askAssistant, listChatHistory, clearChatHistory } from "@/lib/library.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({ meta: [{ title: "AI Assistant — Limitless" }] }),
  component: AssistantPage,
});

function AssistantPage() {
  const ask = useServerFn(askAssistant);
  const list = useServerFn(listChatHistory);
  const clear = useServerFn(clearChatHistory);
  const qc = useQueryClient();

  const { data: history } = useQuery({
    queryKey: ["chat"],
    queryFn: () => list(),
  });

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [history, pending]);

  const messages = [
    ...(history ?? []).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ...pending,
  ];

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    setPending([{ role: "user", content: text }, { role: "assistant", content: "..." }]);
    try {
      const recent = (history ?? []).slice(-20).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
      await ask({ data: { message: text, history: recent } });
      setPending([]);
      qc.invalidateQueries({ queryKey: ["chat"] });
    } catch (e) {
      setPending([]);
      toast.error(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-6 flex flex-col">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary mb-1 flex items-center gap-2">
              <Sparkles className="size-3.5" /> Personal AI tutor
            </p>
            <h1 className="font-display text-3xl font-bold">Ask Limitless anything</h1>
          </div>
          {!!history?.length && (
            <Button variant="ghost" size="sm" onClick={async () => { await clear(); qc.invalidateQueries({ queryKey: ["chat"] }); }}>
              <Trash2 className="size-4 mr-2" />Clear
            </Button>
          )}
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto rounded-2xl border border-border bg-gradient-card p-5 space-y-5 min-h-[400px]">
          {messages.length === 0 ? (
            <div className="grid place-items-center h-full text-center text-muted-foreground py-20">
              <div>
                <Bot className="size-12 mx-auto mb-3 text-primary" />
                <p className="font-medium text-foreground mb-1">Hi! I'm your study companion.</p>
                <p className="text-sm">Ask me to explain a concept, quiz you, brainstorm, or break down anything.</p>
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`size-8 shrink-0 rounded-lg grid place-items-center ${m.role === "user" ? "bg-secondary" : "bg-gradient-primary"}`}>
                  {m.role === "user" ? <UserIcon className="size-4" /> : <Bot className="size-4 text-primary-foreground" />}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                  {m.content === "..." ? <Loader2 className="size-4 animate-spin" /> : m.content}
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="mt-4 flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask anything…"
            className="min-h-[60px] resize-none"
            disabled={sending}
          />
          <Button type="submit" disabled={sending || !input.trim()} className="bg-gradient-primary text-primary-foreground self-end h-[60px] px-5">
            <Send className="size-4" />
          </Button>
        </form>
      </main>
    </div>
  );
}
