import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fenceUntrustedSource, MAX_SOURCE_CHARS } from "@/lib/security";
import { enforceGuestRateLimit } from "@/lib/rate-limit.server";

const inputSchema = z.object({
  text: z.string().min(20).max(120_000),
  title: z.string().max(200).optional(),
});

const storySchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    world: { type: "string" },
    characters: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          role: { type: "string" },
          concept: { type: "string" },
          body: { type: "string", enum: ["round", "slim", "broad", "chibi"] },
          hair: { type: "string", enum: ["bald", "short", "bob", "spiky", "long", "mohawk"] },
          hairColor: { type: "string" },
          eyes: { type: "string", enum: ["dot", "wide", "sleepy", "star"] },
          mouth: { type: "string", enum: ["flat", "smile", "open", "none"] },
          clothing: { type: "string", enum: ["tshirt", "hoodie", "robe", "armor", "overalls"] },
          clothingColor: { type: "string" },
          skin: { type: "string" },
          accessory: { type: "string", enum: ["none", "glasses", "headband", "crown", "hat"] },
        },
        required: ["name", "role", "concept", "body", "hair", "hairColor", "eyes", "mouth", "clothing", "clothingColor", "skin", "accessory"],
      },
    },
    chapters: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          topic: { type: "string" },
          scenes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                speaker: { type: "string" },
                line: { type: "string" },
                narration: { type: "string" },
              },
              required: ["speaker", "line"],
            },
          },
          lesson: { type: "string" },
          checkpoint: {
            type: "object",
            properties: {
              question: { type: "string" },
              options: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 },
              correctIndex: { type: "number" },
            },
            required: ["question", "options", "correctIndex"],
          },
        },
        required: ["title", "topic", "scenes", "lesson", "checkpoint"],
      },
    },
  },
  required: ["title", "world", "characters", "chapters"],
};

export type StoryCharacter = {
  name: string;
  role: string;
  concept: string;
  body: string;
  hair: string;
  hairColor: string;
  eyes: string;
  mouth: string;
  clothing: string;
  clothingColor: string;
  skin: string;
  accessory: string;
};

export type StoryChapter = {
  title: string;
  topic: string;
  scenes: { speaker: string; line: string; narration?: string }[];
  lesson: string;
  checkpoint: { question: string; options: string[]; correctIndex: number };
};

export type StoryMode = {
  title: string;
  world: string;
  characters: StoryCharacter[];
  chapters: StoryChapter[];
};

export const generateStoryMode = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data }): Promise<StoryMode> => {
    await enforceGuestRateLimit("story");
    if (data.text.length > MAX_SOURCE_CHARS) {
      throw new Error("That document is too long — please split it up.");
    }
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const systemPrompt = `You are the Quest Weaver for "Limitless", a Habitica-style pixel RPG study app. Turn study material into an 8-bit adventure that TEACHES the topic through story.

Rules:
- Invent a small cast (3-5) of pixel-RPG characters DERIVED FROM THE SOURCE: each character personifies a real concept, force, term, person, or process in the material (e.g. a mitochondrion becomes "Mitok, the Ember Forgemaster"). Give each an RPG role (Guide, Hero, Rival, Boss, Sage) and a one-line "concept" saying exactly which idea from the source they embody.
- For each character choose pixel-sprite traits from the allowed enums, plus hex colors for hairColor, clothingColor, and skin (skin may be fantastical, e.g. #7fd6a2 for a slime sage). Match the concept: fiery concept -> warm colors, armor; abstract theory -> robe, crown.
- Write 5-9 chapters, one per major topic of the source, in a logical learning order. Each chapter has 6-10 dialogue scenes. "speaker" MUST be a character name from the cast, or "Narrator". Lines are short (max ~45 words), in-character, playful, and carry REAL accurate content — definitions, formulas, causes, examples. No filler banter.
- Each chapter ends with a plain-language "lesson" (2-3 sentences of the actual takeaway) and a 3-option checkpoint question with 0-indexed correctIndex.
- Habitica energy: quests, parties, boss fights, loot, "you gained +XP" flavour in Narrator lines. Never sacrifice accuracy for flavour, never invent facts not supported by the source.`;

    const userPrompt = `${data.title ? `Source title: ${data.title}\n\n` : ""}Study material:\n\n${fenceUntrustedSource(data.text)}`;

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
          function: { name: "emit_story", description: "Emit the pixel RPG story mode", parameters: storySchema },
        }],
        tool_choice: { type: "function", function: { name: "emit_story" } },
      }),
    });

    if (!resp.ok) {
      const body = await resp.text();
      if (resp.status === 429) throw new Error("Rate limit hit — please wait a moment and retry.");
      if (resp.status === 402) throw new Error("AI credits exhausted. Add credits in Settings → Workspace → Usage.");
      throw new Error(`AI gateway error ${resp.status}: ${body.slice(0, 300)}`);
    }

    const json = await resp.json();
    const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("AI returned no structured output");
    return (typeof args === "string" ? JSON.parse(args) : args) as StoryMode;
  });
