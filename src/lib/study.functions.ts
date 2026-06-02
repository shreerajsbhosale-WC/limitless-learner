import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  text: z.string().min(50).max(120_000),
  title: z.string().max(200).optional(),
  animeMode: z.boolean().optional(),
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

    const systemPrompt = `You are Limitless, an elite study companion. From the provided study material, produce:
- A short title (<= 80 chars) and 2-3 sentence summary
- 4-7 structured note sections, each with a clear heading and 3-6 concise bullet points
- 10-16 flashcards (front = question or term, back = clear concise answer)
- 8-12 multiple-choice quiz questions with EXACTLY 4 options each, a 0-indexed correctIndex, and a 1-2 sentence explanation
Be accurate, specific, and faithful to the source. Avoid filler.`;

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
