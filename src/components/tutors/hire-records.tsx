"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Briefcase, ImagePlus, MapPin, Presentation, Plus, RotateCcw, Trash2, Undo2, X } from "lucide-react";
import type { HireRow } from "@/lib/data/hires";
import { DEMO_DEPOSIT, POSTER_ALLOWED_TYPES, POSTER_MAX_BYTES, commissionFor } from "@/lib/constants";
import { compressImage } from "@/lib/compress-image";
import { cn, formatDate, formatNpr } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";

export type RecordKind = "hire" | "demo";

const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu" }).format(new Date());

// ---- List on the tutor profile --------------------------------------------

export function HireRecords({ tutorId, tutorName, hires }: { tutorId: string; tutorName: string; hires: HireRow[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState<RecordKind | null>(null);
  const [removing, setRemoving] = useState<HireRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function toggleRefund(h: HireRow) {
    setBusyId(h.id);
    try {
      const res = await fetch(`/api/hires/${h.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refunded: !h.refunded }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not update the deposit");
      toast.success(h.refunded ? "Deposit marked as held" : "Deposit marked as refunded");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="space-y-3">
        {hires.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-strong px-4 py-6 text-center">
            <p className="text-sm font-medium">No hires or demo classes yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Changing the status to Demo or Hired asks for the deposit or commission and records it here.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {hires.map((h) => {
              const demo = h.kind === "demo";
              return (
                <li key={h.id} className={cn("flex gap-3 rounded-xl border p-3", demo ? "border-cyan-200 bg-cyan-50/40" : "border-border")}>
                  {h.posterUrl ? (
                    <a href={h.posterUrl} target="_blank" rel="noopener" className="shrink-0" title="Open vacancy poster">
                      {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary image, already sized */}
                      <img
                        src={h.posterUrl.replace("/upload/", "/upload/c_fill,w_160,h_200,q_auto,f_auto/")}
                        alt={`Vacancy poster: ${h.vacancyTitle}`}
                        className="h-[100px] w-20 rounded-lg object-cover ring-1 ring-border"
                      />
                    </a>
                  ) : (
                    <span className="grid h-[100px] w-20 shrink-0 place-items-center rounded-lg bg-surface-muted text-subtle-foreground">
                      {demo ? <Presentation className="size-5" aria-hidden /> : <Briefcase className="size-5" aria-hidden />}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span
                          className={cn(
                            "mb-1 inline-block rounded-full px-2 py-px text-[11px] font-semibold",
                            demo ? "bg-cyan-100 text-cyan-800" : "bg-violet-100 text-violet-800"
                          )}
                        >
                          {demo ? "Demo class" : "Hired"}
                        </span>
                        <p className="text-sm font-semibold">{h.vacancyTitle}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove record ${h.vacancyTitle}`}
                        title="Remove record"
                        onClick={() => setRemoving(h)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {demo ? "Demo on" : "Hired"} {formatDate(h.hiredAt)}
                      {h.studentLocation && (
                        <>
                          {" · "}
                          <MapPin className="inline size-3 align-[-1px]" aria-hidden /> {h.studentLocation}
                        </>
                      )}
                    </p>
                    <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <dt className="text-xs text-muted-foreground">{demo ? "Expected salary / month" : "Teacher salary / month"}</dt>
                        <dd className="font-medium tabular">{h.monthlySalary ? formatNpr(h.monthlySalary) : "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">{demo ? "Demo deposit" : "Our commission"}</dt>
                        <dd className={cn("font-semibold tabular", demo && h.refunded ? "text-muted-foreground line-through" : "text-emerald-700")}>
                          {formatNpr(h.commission)}
                        </dd>
                      </div>
                    </dl>
                    {demo && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={cn("text-xs font-medium", h.refunded ? "text-muted-foreground" : "text-cyan-800")}>
                          {h.refunded ? "Deposit refunded" : "Deposit held"}
                        </span>
                        <Button variant="secondary" size="sm" loading={busyId === h.id} onClick={() => toggleRefund(h)}>
                          {busyId !== h.id && (h.refunded ? <Undo2 aria-hidden /> : <RotateCcw aria-hidden />)}
                          {h.refunded ? "Undo refund" : "Mark refunded"}
                        </Button>
                      </div>
                    )}
                    {h.note && <p className="mt-2 whitespace-pre-line text-xs text-muted-foreground">{h.note}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => setAdding("demo")}>
            <Plus aria-hidden /> Add demo class
          </Button>
          <Button variant="secondary" onClick={() => setAdding("hire")}>
            <Plus aria-hidden /> Add hire
          </Button>
        </div>
      </div>

      <Dialog open={!!adding} onOpenChange={(o) => !o && setAdding(null)}>
        <DialogContent>
          {adding && (
            <>
              <DialogHeader>
                <DialogTitle>{adding === "demo" ? "Add demo class" : "Add hire record"}</DialogTitle>
                <DialogDescription>
                  {adding === "demo" ? "Record the demo class and deposit" : "Record the vacancy"} for{" "}
                  <span className="font-medium text-foreground">{tutorName}</span>. The amounts count towards Revenue.
                </DialogDescription>
              </DialogHeader>
              <RecordForm
                formId="add-record"
                tutorId={tutorId}
                tutorName={tutorName}
                kind={adding}
                onSaved={() => setAdding(null)}
                onBusy={setSaving}
              />
              <DialogFooter>
                <Button variant="secondary" onClick={() => setAdding(null)}>
                  Cancel
                </Button>
                <Button type="submit" form="add-record" loading={saving}>
                  {adding === "demo" ? "Save demo" : "Save hire"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <DialogContent>{removing && <RemoveHire hire={removing} onDone={() => setRemoving(null)} />}</DialogContent>
      </Dialog>
    </>
  );
}

// ---- Shared form: profile "Add" dialogs and the Change status dialog -------

/**
 * Hire / demo details form. Submits to POST /api/tutors/:id/hires, which also
 * sets the tutor's status (Hired / Demo). Render the submit button outside with
 * form={formId}; `onBusy` reports progress so that button can show a spinner.
 */
export function RecordForm({
  formId,
  tutorId,
  tutorName,
  kind,
  onSaved,
  onBusy,
}: {
  formId: string;
  tutorId: string;
  tutorName: string;
  kind: RecordKind;
  onSaved: () => void;
  onBusy?: (busy: boolean) => void;
}) {
  const router = useRouter();
  const demo = kind === "demo";
  const fileRef = useRef<HTMLInputElement>(null);
  const [poster, setPoster] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [salary, setSalary] = useState("");
  const [commission, setCommission] = useState(demo ? String(DEMO_DEPOSIT) : "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function pickPoster(file: File | undefined) {
    if (!file) return;
    if (!POSTER_ALLOWED_TYPES.includes(file.type)) {
      setErrors((e) => ({ ...e, poster: "Choose a JPG, PNG or WEBP image" }));
      return;
    }
    const small = await compressImage(file, 2000, 0.85);
    if (small.size > POSTER_MAX_BYTES) {
      setErrors((e) => ({ ...e, poster: "Poster must be 4 MB or smaller" }));
      return;
    }
    setErrors((e) => {
      const next = { ...e };
      delete next.poster;
      return next;
    });
    if (preview) URL.revokeObjectURL(preview);
    setPoster(small);
    setPreview(URL.createObjectURL(small));
  }

  function clearPoster() {
    if (preview) URL.revokeObjectURL(preview);
    setPoster(null);
    setPreview("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    const form = new FormData(e.currentTarget);
    form.delete("posterFile");
    form.set("kind", kind);
    if (poster) form.set("poster", poster);
    setSaving(true);
    onBusy?.(true);
    setErrors({});
    try {
      const res = await fetch(`/api/tutors/${tutorId}/hires`, { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.fields) setErrors(data.fields);
        throw new Error(data.error ?? "Could not save the record");
      }
      toast.success(demo ? `Demo class recorded for ${tutorName}` : `Hire recorded for ${tutorName}`);
      clearPoster();
      onSaved();
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
      onBusy?.(false);
    }
  }

  const salaryNum = Number(salary) || 0;
  const id = (name: string) => `${formId}-${name}`;

  return (
    <form id={formId} onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor={id("title")}>{demo ? "Demo class for (vacancy / student)" : "Vacancy / job"}</Label>
        <Input
          id={id("title")}
          name="vacancyTitle"
          required
          maxLength={150}
          placeholder="e.g. Grade 8 Maths & Science, home tuition"
          aria-invalid={!!errors.vacancyTitle}
        />
        <FieldError>{errors.vacancyTitle}</FieldError>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={id("location")}>
            Student location <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input id={id("location")} name="studentLocation" maxLength={120} placeholder="e.g. Lakeside" />
          <FieldError>{errors.studentLocation}</FieldError>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={id("date")}>{demo ? "Demo start date" : "Hire date"}</Label>
          <Input id={id("date")} name="hiredAt" type="date" defaultValue={today()} required aria-invalid={!!errors.hiredAt} />
          <FieldError>{errors.hiredAt}</FieldError>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={id("salary")}>
            {demo ? "Expected salary / month (Rs.)" : "Teacher salary / month (Rs.)"}
            {demo && <span className="font-normal text-muted-foreground"> (optional)</span>}
          </Label>
          <Input
            id={id("salary")}
            name="monthlySalary"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            placeholder="e.g. 8000"
            aria-invalid={!!errors.monthlySalary}
          />
          <FieldError>{errors.monthlySalary}</FieldError>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={id("commission")}>{demo ? "Demo deposit (Rs.)" : "Our commission (Rs.)"}</Label>
          <Input
            id={id("commission")}
            name="commission"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
            placeholder={demo ? String(DEMO_DEPOSIT) : "e.g. 4000"}
            aria-invalid={!!errors.commission}
          />
          <FieldError>{errors.commission}</FieldError>
        </div>
      </div>
      {demo ? (
        <p className="-mt-2 text-xs text-muted-foreground">
          Minimum deposit is {formatNpr(DEMO_DEPOSIT)}, refunded if the tutor is not selected. Mark it refunded on the
          tutor&apos;s profile.
        </p>
      ) : (
        salaryNum > 0 && (
          <div className="-mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Commission:</span>
            <button
              type="button"
              onClick={() => setCommission(String(commissionFor(salaryNum)))}
              className="rounded-full border border-primary/40 bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary hover:bg-primary-soft/70 cursor-pointer"
              title="Rate from the tutor service agreement"
            >
              Policy rate = {formatNpr(commissionFor(salaryNum))}
            </button>
            {[25, 50, 100].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => setCommission(String(Math.round((salaryNum * pct) / 100)))}
                className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium hover:bg-surface-muted cursor-pointer"
              >
                {pct}% = {formatNpr((salaryNum * pct) / 100)}
              </button>
            ))}
          </div>
        )
      )}

      <div className="space-y-1.5">
        <Label htmlFor={id("poster")}>
          Vacancy poster <span className="font-normal text-muted-foreground">(optional photo)</span>
        </Label>
        {preview ? (
          <div className="flex items-center gap-3 rounded-xl border border-border p-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
            <img src={preview} alt="Selected vacancy poster" className="h-20 w-16 rounded-md object-cover ring-1 ring-border" />
            <p className="min-w-0 flex-1 truncate text-sm">{poster?.name}</p>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove poster" onClick={clearPoster}>
              <X />
            </Button>
          </div>
        ) : (
          <label
            htmlFor={id("poster")}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong px-4 py-4 text-sm text-muted-foreground hover:bg-surface-muted"
          >
            <ImagePlus className="size-5" aria-hidden /> Choose poster image (JPG, PNG, WEBP)
          </label>
        )}
        <input
          ref={fileRef}
          id={id("poster")}
          name="posterFile"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => pickPoster(e.target.files?.[0])}
        />
        <FieldError>{errors.poster}</FieldError>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={id("note")}>
          Note <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea id={id("note")} name="note" rows={2} maxLength={1000} placeholder="e.g. Parent: Ram Sharma, 6–7 PM, Sun–Fri" />
      </div>
    </form>
  );
}

function RemoveHire({ hire, onDone }: { hire: HireRow; onDone: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function remove() {
    setBusy(true);
    try {
      const res = await fetch(`/api/hires/${hire.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not remove the record");
      toast.success("Record removed");
      onDone();
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <DialogHeader>
        <DialogTitle>Remove this record?</DialogTitle>
        <DialogDescription>
          This deletes <span className="font-medium text-foreground">{hire.vacancyTitle}</span> and its poster, and
          removes {formatNpr(hire.commission)} from Revenue. The tutor&apos;s status is not changed.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={remove} loading={busy}>
          Remove record
        </Button>
      </DialogFooter>
    </>
  );
}
