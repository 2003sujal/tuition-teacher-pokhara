"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input, Label, NativeSelect } from "@/components/ui/input";

/** "Save snapshot" button: stores a year's current revenue figures permanently. */
export function SaveSnapshotButton({ years, defaultYear }: { years: string[]; defaultYear: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(defaultYear);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/revenue/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, note }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not save the snapshot");
      toast.success(`Revenue for ${year} saved`);
      setOpen(false);
      setNote("");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={years.length === 0}>
        <Save aria-hidden /> Save snapshot
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save revenue snapshot</DialogTitle>
            <DialogDescription>
              Stores this year&apos;s figures exactly as they are now, month by month, so you can compare them later even
              if records change. Finished years are also saved automatically at year end.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="snap-year">Year</Label>
              <NativeSelect id="snap-year" value={year} onChange={(e) => setYear(e.target.value)}>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="snap-note">
                Note <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="snap-note"
                maxLength={300}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Figures at end of Kartik, before audit"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              Save snapshot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
