import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fenceUntrustedSource, MAX_SOURCE_CHARS } from "@/lib/security";
import { enforceGuestRateLimit } from "@/lib/rate-limit.server";

const inputSchema = z.object({
  text: z.string().min(20).max(120_000),
  title: z.string().max(200).optional(),
  animeMode: z.boolean().optional(),
  musicMode: z.boolean().optional(),
  sourceLabel: z.string().max(200).optional(),
});

const studyMaterialsSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    notes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          heading: { type: "string" },
          points: { type: "array", items: { type: "string" } },
        },
        required: ["heading", "points"],
      },
    },
    flashcards: {
      type: "array",
      items: {
        type: "object",
        properties: { front: { type: "string" }, back: { type: "string" } },
        required: ["front", "back"],
      },
    },
    quiz: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
          correctIndex: { type: "number" },
          explanation: { type: "string" },
        },
        required: ["question", "options", "correctIndex", "explanation"],
      },
    },
  },
  required: ["title", "summary", "notes", "flashcards", "quiz"],
};

export type StudyMaterials = {
  title: string;
  summary: string;
  notes: { heading: string; points: string[] }[];
  flashcards: { front: string; back: string }[];
  quiz: { question: string; options: string[]; correctIndex: number; explanation: string }[];
};

export const generateStudyMaterials = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<StudyMaterials> => {
    // Reachable without an account (guests may generate but not save), so the
    // per-visitor limiter is what protects the AI budget here.
    await enforceGuestRateLimit("generate");
    if (data.text.length > MAX_SOURCE_CHARS) {
      throw new Error("That document is too long — please split it up.");
    }
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const animeAddon = data.animeMode
      ? `\n\nANIME MODE IS ON. For EVERY note bullet, weave in a brief, vivid anime analogy or reference that clarifies the concept — use well-known series (Naruto, One Piece, Attack on Titan, Demon Slayer, JJK, Death Note, FMA, My Hero Academia, Dragon Ball, Bleach, Hunter x Hunter, Code Geass, Steins;Gate, Evangelion, etc.). Format each bullet as: "<concept explanation> — Like <anime reference>: <one-sentence parallel>." Keep the analogies tasteful and genuinely illuminating, not forced. Flashcard backs and quiz explanations should also drop in an anime parallel when it helps. Sprinkle a little shōnen energy into the summary too. Never sacrifice accuracy for flavor.`
      : "";

    const musicAddon = data.musicMode
      ? `\n\nMUSIC MODE IS ON. For EVERY note bullet, weave in a brief, vivid music analogy or reference that clarifies the concept — draw across genres and eras (The Beatles, Queen, Pink Floyd, Michael Jackson, Beyoncé, Taylor Swift, Kendrick Lamar, Kanye West, Drake, Daft Punk, Radiohead, Nirvana, Bob Dylan, Mozart, Beethoven, Miles Davis, Bad Bunny, BTS, Billie Eilish, Frank Ocean, Tyler the Creator, etc.) — songs, albums, lyrics, production techniques, or music theory (rhythm, harmony, counterpoint, crescendo). Format each bullet as: "<concept explanation> — Like <music reference>: <one-sentence parallel>." Keep analogies tasteful and genuinely illuminating, not forced. Flashcard backs and quiz explanations should also drop in a music parallel when it helps. Let the summary carry a little rhythm too. Never sacrifice accuracy for flavor.`
      : "";

    const systemPrompt = `You are Limitless, an elite study companion powering an RPG-style learning experience. Your job is to produce COMPLETE, EXHAUSTIVE study material that covers 100% of the topics, concepts, definitions, formulas, examples, and edge cases present in the source — nothing skipped, nothing glossed over. Treat the source as a syllabus you must fully teach.

From the provided study material, produce:
- A short title (<= 80 chars) and a 3-5 sentence summary capturing every major theme
- As many structured note sections as the source demands to cover 100% of its topics (typically 8-20+, more if needed). Each section: a clear heading and 5-12 concise, information-dense bullets organized hierarchically (concept → detail → example → edge case). Do NOT collapse or omit sub-topics — if the source mentions it, it appears here.
- 25-60 flashcards (scale with source depth) covering every term, definition, formula, and key idea (front = question or term; back = clear, complete answer with a memory tip when useful)
- 15-30 multiple-choice quiz questions spanning every major topic, EXACTLY 4 options each, 0-indexed correctIndex, and a 1-2 sentence explanation that teaches
Be accurate, specific, and faithful to the source — never invent facts or formulas. If the source is thin (e.g. a video title only), generate the full standard curriculum for that topic and note when you're inferring. Prefer completeness over brevity; never drop a topic to save space.${animeAddon}${musicAddon}`;

    const userPrompt = `${data.sourceLabel ? `Source: ${data.sourceLabel}\n` : ""}${data.title ? `Document title: ${data.title}\n\n` : ""}Study material:\n\n${fenceUntrustedSource(data.text)}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: { name: "emit_study_materials", description: "Emit structured study materials", parameters: studyMaterialsSchema },
        }],
        tool_choice: { type: "function", function: { name: "emit_study_materials" } },
      }),
    });

    if (!resp.ok) {
      const body = await resp.text();
      if (resp.status === 429) throw new Error("Rate limit hit — please wait a moment and retry.");
      if (resp.status === 402) throw new Error("AI credits exhausted. Add credits in Settings → Workspace → Usage.");
      throw new Error(`AI gateway error ${resp.status}: ${body.slice(0, 300)}`);
    }

    const json = await resp.json();
    const toolCall = json?.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall?.function?.arguments;
    if (!args) throw new Error("AI returned no structured output");
    const parsed = typeof args === "string" ? JSON.parse(args) : args;
    return parsed as StudyMaterials;
  });

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const m = u.pathname.match(/\/(?:embed|shorts)\/([\w-]+)/);
      if (m) return m[1];
    }
  } catch {}
  return null;
}

export const fetchVideoMeta = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ url: z.string().url().max(500) }).parse(d))
  .handler(async ({ data }) => {
    const ytId = extractYouTubeId(data.url);
    if (ytId) {
      try {
        const r = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`);
        if (r.ok) {
          const j = await r.json();
          return {
            title: j.title as string,
            author: j.author_name as string,
            text: `YouTube video titled "${j.title}" by ${j.author_name}.`,
          };
        }
      } catch {}
    }
    return { title: data.url, author: "", text: `Video at ${data.url}.` };
  });

export const explainMistake = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      question: z.string().max(2000),
      correct: z.string().max(500),
      picked: z.string().max(500),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    await enforceGuestRateLimit("explain");
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a kind, sharp tutor. The student got a question wrong. In 2-3 short paragraphs: (1) explain why the correct answer is right, (2) explain why their pick is wrong, (3) one memory trick or quick tip. Be warm, never condescending." },
          { role: "user", content: `Question: ${data.question}\n\nCorrect answer: ${data.correct}\nMy pick: ${data.picked}` },
        ],
      }),
    });
    if (!resp.ok) throw new Error(`AI error ${resp.status}`);
    const json = await resp.json();
    return { explanation: json?.choices?.[0]?.message?.content ?? "" };
  });

