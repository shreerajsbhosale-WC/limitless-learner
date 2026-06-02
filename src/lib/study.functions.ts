import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  text: z.string().min(50).max(120_000),
  title: z.string().max(200).optional(),
  animeMode: z.boolean().optional(),
  musicMode: z.boolean().optional(),
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
        properties: {
          front: { type: "string" },
          back: { type: "string" },
        },
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
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
};

export const generateStudyMaterials = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<StudyMaterials> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const animeAddon = data.animeMode
      ? `\n\nANIME MODE IS ON. For EVERY note bullet, weave in a brief, vivid anime analogy or reference that clarifies the concept — use well-known series (Naruto, One Piece, Attack on Titan, Demon Slayer, JJK, Death Note, FMA, My Hero Academia, Dragon Ball, Bleach, Hunter x Hunter, Code Geass, Steins;Gate, Evangelion, etc.). Format each bullet as: "<concept explanation> — Like <anime reference>: <one-sentence parallel>." Keep the analogies tasteful and genuinely illuminating, not forced. Flashcard backs and quiz explanations should also drop in an anime parallel when it helps. Sprinkle a little shōnen energy into the summary too. Never sacrifice accuracy for flavor.`
      : "";

    const musicAddon = data.musicMode
      ? `\n\nMUSIC MODE IS ON. For EVERY note bullet, weave in a brief, vivid music analogy or reference that clarifies the concept — draw across genres and eras (The Beatles, Queen, Pink Floyd, Michael Jackson, Beyoncé, Taylor Swift, Kendrick Lamar, Kanye West, Drake, Daft Punk, Radiohead, Nirvana, Bob Dylan, Mozart, Beethoven, Miles Davis, Bad Bunny, BTS, Billie Eilish, Frank Ocean, Tyler the Creator, etc.) — songs, albums, lyrics, production techniques, or music theory (rhythm, harmony, counterpoint, crescendo). Format each bullet as: "<concept explanation> — Like <music reference>: <one-sentence parallel>." Keep analogies tasteful and genuinely illuminating, not forced. Flashcard backs and quiz explanations should also drop in a music parallel when it helps. Let the summary carry a little rhythm too. Never sacrifice accuracy for flavor.`
      : "";

    const systemPrompt = `You are Limitless, an elite study companion. From the provided study material, produce:
- A short title (<= 80 chars) and 2-3 sentence summary
- 4-7 structured note sections, each with a clear heading and 3-6 concise bullet points
- 10-16 flashcards (front = question or term, back = clear concise answer)
- 8-12 multiple-choice quiz questions with EXACTLY 4 options each, a 0-indexed correctIndex, and a 1-2 sentence explanation
Be accurate, specific, and faithful to the source. Avoid filler.${animeAddon}`;


    const userPrompt = `${data.title ? `Document title: ${data.title}\n\n` : ""}Study material:\n\n${data.text}`;

    const resp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": apiKey,
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "emit_study_materials",
                description: "Emit structured study materials",
                parameters: studyMaterialsSchema,
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "emit_study_materials" },
          },
        }),
      },
    );

    if (!resp.ok) {
      const body = await resp.text();
      if (resp.status === 429) {
        throw new Error("Rate limit hit — please wait a moment and retry.");
      }
      if (resp.status === 402) {
        throw new Error("AI credits exhausted. Add credits in Settings → Workspace → Usage.");
      }
      throw new Error(`AI gateway error ${resp.status}: ${body.slice(0, 300)}`);
    }

    const json = await resp.json();
    const toolCall = json?.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall?.function?.arguments;
    if (!args) throw new Error("AI returned no structured output");

    const parsed = typeof args === "string" ? JSON.parse(args) : args;
    return parsed as StudyMaterials;
  });
