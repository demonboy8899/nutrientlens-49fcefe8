import { PiggyBank, Plus } from "lucide-react";
import { Card, SectionTitle } from "@/components/ui-kit";
import {
  suggestBudgetFoods,
  type BudgetFood,
  type Remaining,
} from "@/lib/budget-foods";

export function BudgetSuggestions({
  remaining,
  onAdd,
  className,
}: {
  remaining: Remaining;
  onAdd?: (food: BudgetFood) => void;
  className?: string;
}) {
  const picks = suggestBudgetFoods(remaining);

  return (
    <Card className={className}>
      <SectionTitle
        right={
          <span className="label-caps text-accent">
            <PiggyBank className="mr-1 inline h-4 w-4" /> budget
          </span>
        }
      >
        Cheap ways to finish the day
      </SectionTitle>

      {picks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          Targets are covered — nothing left to fill.
        </p>
      ) : (
        <>
          <p className="mb-3 text-xs text-muted-foreground">
            {Math.max(0, Math.round(remaining.protein))}g protein ·{" "}
            {Math.max(0, Math.round(remaining.carbs))}g carbs ·{" "}
            {Math.max(0, Math.round(remaining.fat))}g fat left
          </p>
          <ul className="space-y-2">
            {picks.map((f) => (
              <li
                key={f.name}
                className="flex items-center gap-3 rounded-xl border border-border bg-elevated px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-semibold uppercase tracking-wide">
                    {f.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {f.serving} · {f.note}
                  </p>
                  <p className="numeric mt-1 text-sm">
                    {f.calories}
                    <span className="ml-1 text-xs text-muted-foreground">kcal</span>
                    <span className="ml-2 text-primary">{f.protein}P</span>
                    <span className="ml-2 text-muted-foreground">
                      {f.carbs}C · {f.fat}F
                    </span>
                  </p>
                </div>
                {onAdd ? (
                  <button
                    aria-label={`Log ${f.name}`}
                    onClick={() => onAdd(f)}
                    className="shrink-0 rounded-full border border-primary/50 bg-primary/10 p-2 text-primary"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
