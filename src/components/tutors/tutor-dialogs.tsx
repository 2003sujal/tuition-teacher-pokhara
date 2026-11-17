"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import { TUTOR_STATUSES, type TutorStatus } from "@/lib/constants";
import { tutorUpdateSchema } from "@/lib/validations";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError, Textarea } from "@/components/ui/input";
import { StatusBadge } from "./status-badge";
import { SubjectPicker } from "@/components/forms/subject-picker";
import { cn } from "@/lib/utils";

export type DialogTutor = {
  id: string;
  fullName: string;
  normalizedMobileNumber: string;
  location: string;
  subjects: string[];
  status: TutorStatus;
  applicationId: string;
};

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error ?? "Request failed"), { fields: data.fields });
  return data;
}

export async function updateStatus(tutorId: string, status: TutorStatus, note = "") {
  return send(`/api/tutors/${tutorId}/status`, "PATCH", { status, note });
}

type DialogProps = { tutor: DialogTutor; open: boolean; onOpenChange: (open: boolean) => void };

export function StatusDialog({ tutor, open, onOpenChange, initial }: DialogProps & { initial?: TutorStatus }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Content unmounts when closed, so the form state starts fresh each time. */}
        <StatusForm tutor={tutor} initial={initial} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function StatusForm({ tutor, initial, onDone }: { tutor: DialogTutor; initial?: TutorStatus; onDone: () => void }) {
  const router = useRouter();
  const [status, setStatus] = useState<TutorStatus>(initial ?? tutor.status);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await updateStatus(tutor.id, status, note);
      toast.success(`${tutor.fullName} marked as ${status}`);
      onDone();
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Change status</DialogTitle>
        <DialogDescription>
          Update the status for <span className="font-medium text-foreground">{tutor.fullName}</span>. The change is
          recorded in the status history.
        </DialogDescription>
      </DialogHeader>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">New status</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {TUTOR_STATUSES.map((s) => (
            <label
              key={s}
              className={cn(
                "flex cursor-pointer items-center justify-center rounded-lg border px-2 py-2.5 transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                status === s ? "border-primary bg-primary-soft ring-2 ring-primary/15" : "border-border hover:bg-surface-muted"
              )}
            >
              <input type="radio" name="status" value={s} checked={status === s} onChange={() => setStatus(s)} className="sr-only" />
              <StatusBadge status={s} />
            </label>
          ))}
        </div>
      </fieldset>
      <div className="mt-4 space-y-1.5">
        <Label htmlFor="status-note">
          Note <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="status-note"
          rows={3}
          maxLength={1000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Called on 17 November, interested in Lakeside tuition"
        />
      </div>
      <DialogFooter>
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button onClick={save} loading={saving} disabled={status === tutor.status}>
          Save status
        </Button>
      </DialogFooter>
    </>
  );
}

type EditValues = z.input<typeof tutorUpdateSchema>;

export function EditTutorDialog({ tutor, open, onOpenChange }: DialogProps) {
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EditValues>({ resolver: zodResolver(tutorUpdateSchema) });

  useEffect(() => {
    if (open) reset({
        fullName: tutor.fullName,
        mobileNumber: tutor.normalizedMobileNumber,
        location: tutor.location,
        subjects: tutor.subjects ?? [],
      });
  }, [open, tutor, reset]);

  async function onSubmit(values: EditValues) {
    try {
      await send(`/api/tutors/${tutor.id}`, "PATCH", values);
      toast.success("Tutor information updated");
      onOpenChange(false);
      router.refresh();
    } catch (e) {
      const fields = (e as { fields?: Record<string, string> }).fields;
      if (fields) for (const [k, v] of Object.entries(fields)) setError(k as keyof EditValues, { message: v });
      toast.error((e as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit information</DialogTitle>
          <DialogDescription>{tutor.applicationId}</DialogDescription>
        </DialogHeader>
        <form id="edit-tutor" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Full name</Label>
            <Input id="edit-name" aria-invalid={!!errors.fullName} {...register("fullName")} />
            <FieldError>{errors.fullName?.message}</FieldError>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-mobile">Mobile number</Label>
            <Input id="edit-mobile" type="tel" aria-invalid={!!errors.mobileNumber} {...register("mobileNumber")} />
            <FieldError>{errors.mobileNumber?.message}</FieldError>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-location">Current location</Label>
            <Input id="edit-location" aria-invalid={!!errors.location} {...register("location")} />
            <FieldError>{errors.location?.message}</FieldError>
          </div>
          <div className="space-y-1.5">
            <Label id="edit-subjects-label" htmlFor="edit-subjects">Subjects</Label>
            <Controller
              control={control}
              name="subjects"
              render={({ field }) => (
                <SubjectPicker id="edit-subjects" compact value={field.value ?? []} onChange={field.onChange} invalid={!!errors.subjects} />
              )}
            />
            <FieldError>{errors.subjects?.message ?? errors.subjects?.root?.message}</FieldError>
          </div>
        </form>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="edit-tutor" loading={isSubmitting}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteTutorDialog({ tutor, open, onOpenChange, redirectTo }: DialogProps & { redirectTo?: string }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DeleteForm tutor={tutor} redirectTo={redirectTo} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function DeleteForm({ tutor, redirectTo, onDone }: { tutor: DialogTutor; redirectTo?: string; onDone: () => void }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState("");

  async function remove() {
    setDeleting(true);
    try {
      await send(`/api/tutors/${tutor.id}`, "DELETE");
      toast.success(`${tutor.fullName} was deleted`);
      onDone();
      if (redirectTo) router.replace(redirectTo);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Delete tutor permanently?</DialogTitle>
        <DialogDescription>
          This removes <span className="font-medium text-foreground">{tutor.fullName}</span> ({tutor.applicationId}),
          their CV file, notes and status history. This cannot be undone. Consider archiving instead.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-1.5">
        <Label htmlFor="confirm-delete">
          Type <span className="font-mono font-semibold">DELETE</span> to confirm
        </Label>
        <Input id="confirm-delete" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
      </div>
      <DialogFooter>
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={remove} loading={deleting} disabled={confirm !== "DELETE"}>
          Delete tutor
        </Button>
      </DialogFooter>
    </>
  );
}
