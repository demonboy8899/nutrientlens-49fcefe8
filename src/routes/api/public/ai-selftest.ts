import { createFileRoute } from "@tanstack/react-router";

// Temporary diagnostic endpoint. Guarded by a one-off token; delete after use.
const TOKEN = "nl-selftest-7f3a91c2";

export const Route = createFileRoute("/api/public/ai-selftest")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (request.headers.get("x-selftest") !== TOKEN) {
          return new Response("Not found", { status: 404 });
        }
        const hasKey = Boolean(
          process.env["GEMINI_API_KEY"] || process.env["Gemini_key"],
        );
        let coach = "";
        let vision = "";
        try {
          const { callGemini } = await import("@/lib/gemini.server");
          coach = await callGemini({
            system: "Reply with exactly: PONG",
            messages: [{ role: "user", parts: [{ text: "ping" }] }],
          });
          // 1x1 red PNG
          vision = await callGemini({
            system: "Answer in one word.",
            messages: [
              {
                role: "user",
                parts: [
                  { text: "What color is this image?" },
                  {
                    imageDataUrl:
                      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
                  },
                ],
              },
            ],
          });
        } catch (e) {
          return new Response(
            JSON.stringify({ hasKey, error: String(e) }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }
        return new Response(JSON.stringify({ hasKey, coach, vision }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
