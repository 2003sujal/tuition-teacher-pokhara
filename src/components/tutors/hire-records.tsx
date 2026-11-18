"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Briefcase, ImagePlus, MapPin, Plus, Trash2, X } from "lucide-react";
import type { HireRow } from "@/lib/data/hires";
import { POSTER_ALLOWED_TYPES, POSTER_MAX_BYTES, commissionFor } from "@/lib/constants";
import { compressImage } from "@/lib/compress-image";
import { formatDate, formatNpr } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";

const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu" }).format(new Date());

export function HireRecords({ tutorId, tutorName, hires }: { tutorId: string; tutorName: string; hires: HireRow[] }) {
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<HireRow | null>(null);

  return (
    <>
      <div className="space-y-3">
        {hires.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-strong px-4 py-6 text-center">
            <p className="text-sm font-medium">No hires recorded yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              When this tutor is hired, add the vacancy poster, salary and our commission here.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {hires.map((h) => (
              <li key={h.id} className="flex gap-3 rounded-xl border border-border p-3">
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
                    <Briefcase className="size-5" aria-hidden />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{h.vacancyTitle}</p>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove hire record ${h.vacancyTitle}`}
                      title="Remove record"
                      onClick={() => setRemoving(h)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Hired {formatDate(h.hiredAt)}
                    {h.studentLocation && (
                      <>
                        {" · "}
                        <MapPin className="inline size-3 align-[-1px]" aria-hidden /> {h.studentLocation}
                      </>
                    )}
                  </p>
                  <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">Teacher salary / month</dt>
                      <dd className="font-medium tabular">{formatNpr(h.monthlySalary)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Our commission</dt>
                      <dd className="font-semibold text-emerald-700 tabular">{formatNpr(h.commission)}</dd>
                    </div>
                  </dl>
                  {h.note && <p className="mt-2 whitespace-pre-line text-xs text-muted-foreground">{h.note}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
        <Button variant="secondary" className="w-full" onClick={() => setAdding(true)}>
          <Plus aria-hidden /> Add hire record
        </Button>
      </div>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <AddHireForm tutorId={tutorId} tutorName={tutorName} onDone={() => setAdding(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <DialogContent>{removing && <RemoveHire hire={removing} onDone={() => setRemoving(null)} />}</DialogContent>
      </Dialog>
    </>
  );
}

function AddHireForm({ tutorId, tutorName, onDone }: { tutorId: string; tutorName: string; onDone: () => void }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [poster, setPoster] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [salary, setSalary] = useState("");
  const [commission, setCommission] = useState("");
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
    const form = new FormData(e.currentTarget);
    form.delete("posterFile");
    if (poster) form.set("poster", poster);
    setSaving(true);
    setErrors({});
    try {
      const res = await fetch(`/api/tutors/${tutorId}/hires`, { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.fields) setErrors(data.fields);
        throw new Error(data.error ?? "Could not save the hire record");
      }
      toast.success(`Hire recorded for ${tutorName}`);
      clearPoster();
      onDone();
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const salaryNum = Number(salary) || 0;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add hire record</DialogTitle>
        <DialogDescription>
          Record the vacancy <span className="font-medium text-foreground">{tutorName}</span> was hired for. The tutor
          is marked as Hired, and the amounts count towards Revenue.
        </DialogDescription>
      </DialogHeader>
      <form id="add-hire" onSubmit={onSubmit} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="hire-title">Vacancy / job</Label>
          <Input id="hire-title" name="vacancyTitle" required maxLength={150} placeholder="e.g. Grade 8 Maths & Science, home tuition" aria-invalid={!!errors.vacancyTitle} />
          <FieldError>{errors.vacancyTitle}</FieldError>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="hire-location">
              Student location <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input id="hire-location" name="studentLocation" maxLength={120} placeholder="e.g. Lakeside" />
            <FieldError>{errors.studentLocation}</FieldError>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hire-date">Hire date</Label>
            <Input id="hire-date" name="hiredAt" type="date" defaultValue={today()} required aria-invalid={!!errors.hiredAt} />
            <FieldError>{errors.hiredAt}</FieldError>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="hire-salary">Teacher salary / month (Rs.)</Label>
            <Input
              id="hire-salary"
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
            <Label htmlFor="hire-commission">Our commission (Rs.)</Label>
            <Input
              id="hire-commission"
              name="commission"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
              placeholder="e.g. 4000"
              aria-invalid={!!errors.commission}
            />
            <FieldError>{errors.commission}</FieldError>
          </div>
        </div>
        {salaryNum > 0 && (
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
        )}

        <div className="space-y-1.5">
          <Label htmlFor="hire-poster">
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
              htmlFor="hire-poster"
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong px-4 py-5 text-sm text-muted-foreground hover:bg-surface-muted"
            >
              <ImagePlus className="size-5" aria-hidden /> Choose poster image (JPG, PNG, WEBP)
            </label>
          )}
          <input
            ref={fileRef}
            id="hire-poster"
            name="posterFile"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => pickPoster(e.target.files?.[0])}
          />
          <FieldError>{errors.poster}</FieldError>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="hire-note">
            Note <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Textarea id="hire-note" name="note" rows={2} maxLength={1000} placeholder="e.g. Parent: Ram Sharma, 6–7 PM, Sun–Fri" />
        </div>
      </form>
      <DialogFooter>
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" form="add-hire" loading={saving}>
          Save hire
        </Button>
      </DialogFooter>
    </>
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
      toast.success("Hire record removed");
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
        <DialogTitle>Remove hire record?</DialogTitle>
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
