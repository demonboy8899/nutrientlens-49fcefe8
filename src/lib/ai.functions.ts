import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const FoodInput = z.object({
  imageDataUrl: z.string().min(20),
  note: z.string().max(300).optional(),
});

export const analyzeFoodPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => FoodInput.parse(d))
  .handler(async ({ data }) => {
    const { callGemini } = await import("./gemini.server");
    const content = await callGemini({
      system:
        'You are a nutrition estimation engine. Given a food photo, estimate the meal. Respond with ONLY minified JSON: {"name":string,"quantity":string,"calories":number,"protein":number,"carbs":number,"fat":number,"confidence":"low"|"medium"|"high"}. Grams for macros, kcal for calories. No markdown fences.',
      messages: [
        {
          role: "user",
          parts: [
            {
              text: data.note
                ? `Estimate the macros. User note: ${data.note}`
                : "Estimate the macros for this meal.",
            },
            { imageDataUrl: data.imageDataUrl },
          ],
        },
      ],
    });

    const cleaned = content.replace(/```json|```/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Could not read that photo. Try another angle.");
    const parsed = JSON.parse(match[0]) as Record<string, unknown>;
    return {
      name: String(parsed.name ?? "Scanned meal"),
      quantity: String(parsed.quantity ?? "1 serving"),
      calories: Math.max(0, Math.round(Number(parsed.calories) || 0)),
      protein: Math.max(0, Math.round(Number(parsed.protein) || 0)),
      carbs: Math.max(0, Math.round(Number(parsed.carbs) || 0)),
      fat: Math.max(0, Math.round(Number(parsed.fat) || 0)),
      confidence: String(parsed.confidence ?? "medium"),
    };
  });

const CoachInput = z.object({
  message: z.string().min(1).max(2000),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .max(20)
    .default([]),
  context: z.string().max(4000).default(""),
});

export const askCoach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CoachInput.parse(d))
  .handler(async ({ data }) => {
    const { callGemini } = await import("./gemini.server");
    const reply = await callGemini({
      system: `You are the NutrientLens AI coach: a blunt, motivating, highly knowledgeable strength and nutrition coach. Be concise (under 180 words unless asked for a full plan), use short punchy lines and bullet points. Reference the athlete's real logged data when relevant. Never give medical advice; suggest a professional for injuries.\n\nATHLETE DATA:\n${data.context}`,
      messages: [
        ...data.history.map((m) => ({
          role: m.role,
          parts: [{ text: m.content }],
        })),
        { role: "user" as const, parts: [{ text: data.message }] },
      ],
    });
    return { reply: reply || "I didn't catch that — ask me again." };
  });
