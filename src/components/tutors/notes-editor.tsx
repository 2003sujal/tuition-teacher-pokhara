"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, Save } from "lucide-react";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const SUGGESTIONS = ["Good Mathematics teacher.", "Available for Lakeside area.", "Call again next month."];

export function NotesEditor({ tutorId, initial }: { tutorId: string; initial: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [saving, setSaving] = useState(false);
  const dirty = value.trim() !== saved.trim();

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/tutors/${tutorId}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not save notes");
      setSaved(value);
      toast.success("Notes saved");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function addLine(text: string) {
    const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Kathmandu" }).format(new Date());
    setValue((v) => `${v.trimEnd()}${v.trim() ? "\n" : ""}[${date}] ${text}`);
  }

  return (
    <div>
      <Textarea
        aria-label="Private admin notes"
        rows={7}
        maxLength={5000}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && dirty) save();
        }}
        placeholder={"e.g. Good Mathematics teacher.\nContacted on 17 November.\nAvailable for Lakeside area."}
      />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => addLine(s)}
            className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground cursor-pointer"
          >
            + {s}
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="size-3" aria-hidden /> Only visible to administrators
          <span className="text-subtle-foreground tabular">· {value.length}/5000</span>
        </p>
        <Button size="sm" onClick={save} loading={saving} disabled={!dirty}>
          {!saving && <Save aria-hidden />} Save notes
        </Button>
      </div>
    </div>
  );
}
