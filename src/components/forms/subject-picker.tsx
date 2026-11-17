"use client";

import { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { COMMON_SUBJECTS, MAX_SUBJECTS } from "@/lib/constants";
import { tidySubject } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Tap common subjects as chips, or type any other subject and press Add/Enter.
 * Value is a de-duplicated list of tidy subject names.
 */
export function SubjectPicker({
  id,
  value,
  onChange,
  invalid,
  describedBy,
  compact,
}: {
  id: string;
  value: string[];
  onChange: (next: string[]) => void;
  invalid?: boolean;
  describedBy?: string;
  compact?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const has = (s: string) => value.some((v) => v.toLowerCase() === s.toLowerCase());
  const full = value.length >= MAX_SUBJECTS;

  function toggle(subject: string) {
    if (has(subject)) onChange(value.filter((v) => v.toLowerCase() !== subject.toLowerCase()));
    else if (!full) onChange([...value, subject]);
  }

  function addDraft() {
    // Allow "Maths, Physics" typed in one go.
    const parts = draft.split(/[,;\n]/).map(tidySubject).filter(Boolean);
    const next = [...value];
    for (const p of parts) {
      if (next.length >= MAX_SUBJECTS) break;
      if (p.length <= 40 && !next.some((v) => v.toLowerCase() === p.toLowerCase())) next.push(p);
    }
    onChange(next);
    setDraft("");
  }

  const custom = value.filter((v) => !COMMON_SUBJECTS.some((c) => c.toLowerCase() === v.toLowerCase()));

  return (
    <div className="space-y-2.5" role="group" aria-labelledby={`${id}-label`} aria-describedby={describedBy}>
      <div className="flex flex-wrap gap-1.5">
        {COMMON_SUBJECTS.map((s) => {
          const on = has(s);
          return (
            <button
              key={s}
              type="button"
              aria-pressed={on}
              disabled={!on && full}
              onClick={() => toggle(s)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
                compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-[13px]",
                on
                  ? "border-primary bg-primary text-white"
                  : cn("bg-surface text-foreground hover:border-primary/50 hover:bg-primary-soft", invalid ? "border-danger/50" : "border-border-strong")
              )}
            >
              {on && <Check className="size-3.5" aria-hidden />}
              {s}
            </button>
          );
        })}
        {custom.map((s) => (
          <span
            key={s}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border border-primary bg-primary font-medium text-white",
              compact ? "py-1 pl-2.5 pr-1 text-xs" : "py-1.5 pl-3 pr-1.5 text-[13px]"
            )}
          >
            {s}
            <button
              type="button"
              onClick={() => toggle(s)}
              className="rounded-full p-0.5 hover:bg-white/20 cursor-pointer"
              aria-label={`Remove ${s}`}
            >
              <X className="size-3.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          id={id}
          value={draft}
          maxLength={80}
          disabled={full}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => draft.trim() && addDraft()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              if (draft.trim()) addDraft();
            }
          }}
          placeholder={full ? `Maximum ${MAX_SUBJECTS} subjects` : "Other subject, e.g. Music, Drawing, IELTS"}
          className={compact ? "h-9" : "h-11 text-base sm:text-sm"}
          aria-invalid={invalid}
        />
        <Button
          type="button"
          variant="secondary"
          className={compact ? "h-9" : "h-11"}
          disabled={!draft.trim() || full}
          onClick={addDraft}
        >
          <Plus aria-hidden /> Add
        </Button>
      </div>
    </div>
  );
}
