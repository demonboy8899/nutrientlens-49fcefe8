const MODEL = "gemini-2.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export type ChatPart = { text: string } | { imageDataUrl: string };

export type ChatMessage = {
  role: "user" | "assistant";
  parts: ChatPart[];
};

function toGeminiPart(part: ChatPart) {
  if ("text" in part) return { text: part.text };
  const match = part.imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Unsupported image format.");
  return { inlineData: { mimeType: match[1], data: match[2] } };
}

export async function callGemini(opts: {
  system: string;
  messages: ChatMessage[];
}): Promise<string> {
  const key = process.env["GEMINI_API_KEY"] || process.env["Gemini_key"];
  if (!key) throw new Error("AI is not configured yet — the Gemini API key is missing.");


  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": key,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: opts.system }] },
      contents: opts.messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: m.parts.map(toGeminiPart),
      })),
    }),
  });

  if (res.status === 429)
    throw new Error("Too many requests right now — try again in a moment.");
  if (res.status === 401 || res.status === 403)
    throw new Error("The Gemini API key was rejected. Check GEMINI_API_KEY.");
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI request failed: ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return (
    json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? ""
  );
}
