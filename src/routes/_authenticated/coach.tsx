import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowUp, Dumbbell } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, SectionTitle } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import { askCoach } from "@/lib/ai.functions";
import { getStyle } from "@/lib/style-library";
import {
  currentUserId,
  useProfile,
  useSessionHistory,
  useWeeklyIntake,
  useWeightLogs,
} from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/coach")({
  head: () => ({
    meta: [
      { title: "AI Coach — NutrientLens" },
      {
        name: "description",
        content:
          "Chat with an AI strength and nutrition coach that reads your logged training, macros and weight to adjust your split week by week.",
      },
      { property: "og:title", content: "AI Coach — NutrientLens" },
      {
        property: "og:description",
        content: "A coach that knows what you actually lifted this week.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CoachPage,
});

type Msg = { id: string; role: "user" | "assistant"; content: string };

const PROMPTS = [
  "Give me my weekly summary",
  "Is my split balanced?",
  "How do I break my bench plateau?",
  "Am I eating enough protein?",
];

function CoachPage() {
  const ask = useServerFn(askCoach);
  const { data: profile } = useProfile();
  const { data: history } = useSessionHistory(14);
  const { data: intake } = useWeeklyIntake();
  const { data: weights } = useWeightLogs();
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [local, setLocal] = useState<Msg[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const stored = useQuery({
    queryKey: ["coach-messages"],
    queryFn: async (): Promise<Msg[]> => {
      const { data, error } = await supabase
        .from("coach_messages")
        .select("id, role, content")
        .order("created_at", { ascending: true })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as Msg[];
    },
  });

  const messages = [...(stored.data ?? []), ...local];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, pending]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [pending]);

  function buildContext() {
    const avg =
      intake && intake.length
        ? Math.round(intake.reduce((s, d) => s + d.calories, 0) / intake.length)
        : 0;
    const sessions = (history ?? [])
      .slice(0, 10)
      .map(
        (h) =>
          `${h.session_date}: ${h.day_label ?? "session"} (${h.style_name ?? "freestyle"}) muscles=${(h.muscle_groups ?? []).join("/") || "n/a"}`,
      )
      .join("\n");
    const w = weights?.[weights.length - 1]?.weight_kg;
    return [
      `Goal: ${profile?.goal ?? "maintain"}`,
      `Targets: ${profile?.calorie_target ?? 0} kcal, P${profile?.protein_target ?? 0} C${profile?.carb_target ?? 0} F${profile?.fat_target ?? 0}`,
      `Avg intake last 7 days: ${avg} kcal`,
      `Body weight: ${w ?? profile?.weight_kg ?? "?"} kg`,
      `Favorite styles: ${(profile?.favorite_styles ?? []).map((id) => getStyle(id)?.name ?? id).join(", ") || "none"}`,
      `Recent sessions:\n${sessions || "none logged"}`,
    ].join("\n");
  }

  async function send(text: string) {
    const content = text.trim();
    if (!content || pending) return;
    setInput("");
    const userMsg: Msg = { id: `local-${Date.now()}`, role: "user", content };
    setLocal((l) => [...l, userMsg]);
    setPending(true);
    try {
      const user_id = await currentUserId();
      await supabase
        .from("coach_messages")
        .insert({ user_id, role: "user", content });
      const res = await ask({
        data: {
          message: content,
          history: messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          context: buildContext(),
        },
      });
      await supabase
        .from("coach_messages")
        .insert({ user_id, role: "assistant", content: res.reply });
      setLocal([]);
      await stored.refetch();
    } catch (err) {
      setLocal((l) => l.filter((m) => m.id !== userMsg.id));
      toast.error(err instanceof Error ? err.message : "Coach unavailable");
    } finally {
      setPending(false);
    }
  }

  return (
    <AppShell title="AI Coach" subtitle="Knows what you actually lifted">
      {messages.length === 0 && !pending && (
        <Card className="text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/15">
            <Dumbbell className="h-7 w-7 text-primary" />
          </span>
          <h2 className="mt-3 text-xl font-bold uppercase">Your corner man</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask about form, splits, macros or plateaus. I read your logs before
            I answer.
          </p>
        </Card>
      )}

      <div className="space-y-4 pb-4">
        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">
                {m.content}
              </p>
            </div>
          ) : (
            <div key={m.id} className="flex gap-2.5">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-elevated">
                <Dumbbell className="h-3.5 w-3.5 text-primary" />
              </span>
              <div className="min-w-0 flex-1 space-y-2 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                {m.content}
              </div>
            </div>
          ),
        )}
        {pending && (
          <div className="flex gap-2.5">
            <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-elevated">
              <Dumbbell className="h-3.5 w-3.5 text-primary" />
            </span>
            <p className="animate-pulse text-sm text-muted-foreground">
              Thinking…
            </p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2 pb-4">
          {PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => send(p)}
              className="rounded-full border border-border bg-elevated px-3 py-2 text-xs font-medium text-muted-foreground"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <div className="sticky bottom-0 -mx-5 border-t border-border bg-background/95 px-5 py-3 backdrop-blur">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-end gap-2"
        >
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            placeholder="Ask your coach…"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            className="max-h-32 min-h-11 w-full flex-1 resize-none rounded-2xl border border-input bg-elevated px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={pending || !input.trim()}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground disabled:opacity-40"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        </form>
      </div>
    </AppShell>
  );
}
