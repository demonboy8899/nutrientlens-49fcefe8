import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callGateway(body: unknown) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI is not configured yet.");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
    },
    body: JSON.stringify(body),
  });
  if (res.status === 429)
    throw new Error("Too many requests right now — try again in a moment.");
  if (res.status === 402)
    throw new Error("AI credits are exhausted. Add credits to keep using the coach.");
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI request failed: ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return json.choices?.[0]?.message?.content ?? "";
}

const FoodInput = z.object({
  imageDataUrl: z.string().min(20),
  note: z.string().max(300).optional(),
});

export const analyzeFoodPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => FoodInput.parse(d))
  .handler(async ({ data }) => {
    const content = await callGateway({
      model: "google/gemini-3.6-flash",
      messages: [
        {
          role: "system",
          content:
            "You are a nutrition estimation engine. Given a food photo, estimate the meal. Respond with ONLY minified JSON: {\"name\":string,\"quantity\":string,\"calories\":number,\"protein\":number,\"carbs\":number,\"fat\":number,\"confidence\":\"low\"|\"medium\"|\"high\"}. Grams for macros, kcal for calories. No markdown fences.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: data.note
                ? `Estimate the macros. User note: ${data.note}`
                : "Estimate the macros for this meal.",
            },
            { type: "image_url", image_url: { url: data.imageDataUrl } },
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
    const reply = await callGateway({
      model: "google/gemini-3.6-flash",
      messages: [
        {
          role: "system",
          content: `You are the NutrientLens AI coach: a blunt, motivating, highly knowledgeable strength and nutrition coach. Be concise (under 180 words unless asked for a full plan), use short punchy lines and bullet points. Reference the athlete's real logged data when relevant. Never give medical advice; suggest a professional for injuries.\n\nATHLETE DATA:\n${data.context}`,
        },
        ...data.history,
        { role: "user", content: data.message },
      ],
    });
    return { reply: reply || "I didn't catch that — ask me again." };
  });
