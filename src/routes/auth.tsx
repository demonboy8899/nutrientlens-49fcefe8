import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff } from "lucide-react";
import { Button, Field } from "@/components/ui-kit";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — NutrientLens" },
      {
        name: "description",
        content:
          "Sign in to NutrientLens to track macros, log workouts and follow athlete training styles.",
      },
      { property: "og:title", content: "Sign in — NutrientLens" },
      {
        property: "og:description",
        content: "Access your macro, workout and progress tracking.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/home" });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/auth",
        });
        if (error) throw error;
        toast.success("Check your email for the reset link.");
        setMode("signin");
        return;
      }
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created. Let's set your targets.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
      navigate({ to: "/home" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center overflow-hidden px-6 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-primary/20 blur-[100px]"
      />
      <div className="relative">
        <p className="label-caps text-primary">Nutrient · Lens</p>
        <h1 className="mt-3 text-4xl font-bold uppercase">
          {mode === "signin"
            ? "Welcome back"
            : mode === "signup"
              ? "Create account"
              : "Reset password"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signin"
            ? "Pick up where you left off."
            : mode === "signup"
              ? "Two minutes to your macro targets."
              : "We'll email you a link to set a new password."}
        </p>

        <form onSubmit={submit} className="mt-8 space-y-3">
          <Field
            label="Email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
          />
          {mode !== "reset" ? (
            <label className="block">
              <span className="label-caps mb-1.5 block">Password</span>
              <div className="flex items-center gap-2 rounded-xl border border-input bg-elevated px-3 py-2.5 focus-within:border-primary">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full min-w-0 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((s) => !s)}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </label>
          ) : null}
          {mode === "signin" ? (
            <button
              type="button"
              onClick={() => setMode("reset")}
              className="block w-full text-right text-xs font-semibold text-primary hover:underline"
            >
              Forgot password?
            </button>
          ) : null}
          <Button size="lg" disabled={busy} type="submit">
            {busy
              ? "Working…"
              : mode === "signin"
                ? "Sign in"
                : mode === "signup"
                  ? "Sign up"
                  : "Send reset link"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-6 w-full text-center text-sm text-muted-foreground"
        >
          {mode === "signin"
            ? "No account? Create one"
            : mode === "signup"
              ? "Already have an account? Sign in"
              : "Back to sign in"}
        </button>
      </div>
    </div>
  );
}