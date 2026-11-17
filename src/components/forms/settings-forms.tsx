"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type FieldValues, type Path, type UseFormSetError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import { ImagePlus, Trash2 } from "lucide-react";
import { settingsSchema, profileSchema, passwordChangeSchema } from "@/lib/validations";
import type { AgencySettings } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError, Textarea } from "@/components/ui/input";
import { BrandMark } from "@/components/layout/brand";

async function submit<T extends FieldValues>(url: string, method: string, body: unknown, setError: UseFormSetError<T>) {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (data.fields) for (const [k, v] of Object.entries(data.fields as Record<string, string>)) setError(k as Path<T>, { message: v });
    throw new Error(data.error ?? "Could not save");
  }
  return data;
}

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <FieldError>{error}</FieldError> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

type SettingsValues = z.input<typeof settingsSchema>;

export function AgencySettingsForm({ initial, defaultLink }: { initial: AgencySettings; defaultLink: string }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      agencyName: initial.agencyName,
      contactNumber: initial.contactNumber,
      contactEmail: initial.contactEmail,
      address: initial.address,
      applicationHeading: initial.applicationHeading,
      applicationDescription: initial.applicationDescription,
      publicApplicationUrl: initial.publicApplicationUrl,
    },
  });

  async function onSubmit(values: SettingsValues) {
    try {
      await submit("/api/settings", "PUT", values, setError);
      reset(values);
      toast.success("Settings saved");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2">
        <h3 className="text-sm font-semibold sm:col-span-2">Agency information</h3>
        <Field id="agencyName" label="Agency name" error={errors.agencyName?.message}>
          <Input id="agencyName" {...register("agencyName")} aria-invalid={!!errors.agencyName} />
        </Field>
        <Field id="contactNumber" label="Contact number" error={errors.contactNumber?.message}>
          <Input id="contactNumber" type="tel" placeholder="+977 98XXXXXXXX" {...register("contactNumber")} />
        </Field>
        <Field id="contactEmail" label="Contact email" error={errors.contactEmail?.message}>
          <Input id="contactEmail" type="email" placeholder="hello@example.com" {...register("contactEmail")} aria-invalid={!!errors.contactEmail} />
        </Field>
        <Field id="address" label="Address" error={errors.address?.message}>
          <Input id="address" placeholder="Pokhara, Nepal" {...register("address")} />
        </Field>
      </section>

      <section className="grid gap-4">
        <h3 className="text-sm font-semibold">Registration form</h3>
        <Field id="applicationHeading" label="Form heading" error={errors.applicationHeading?.message}>
          <Input id="applicationHeading" {...register("applicationHeading")} aria-invalid={!!errors.applicationHeading} />
        </Field>
        <Field id="applicationDescription" label="Form description" error={errors.applicationDescription?.message}>
          <Textarea id="applicationDescription" rows={3} {...register("applicationDescription")} aria-invalid={!!errors.applicationDescription} />
        </Field>
        <Field
          id="publicApplicationUrl"
          label="Public application URL"
          hint={`Leave empty to use ${defaultLink}. This is the link copied by “Copy Registration Link”.`}
          error={errors.publicApplicationUrl?.message}
        >
          <Input id="publicApplicationUrl" type="url" placeholder={defaultLink} {...register("publicApplicationUrl")} aria-invalid={!!errors.publicApplicationUrl} />
        </Field>
      </section>

      <div className="flex justify-end border-t border-border pt-5">
        <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
          Save settings
        </Button>
      </div>
    </form>
  );
}

export function LogoUploader({ logo }: { logo: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    setBusy(true);
    try {
      const body = new FormData();
      body.set("logo", file);
      const res = await fetch("/api/uploads/logo", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      toast.success("Logo updated");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      const res = await fetch("/api/uploads/logo", { method: "DELETE" });
      if (!res.ok) throw new Error("Could not remove logo");
      toast.success("Logo removed");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <BrandMark logo={logo} className="size-16 rounded-xl text-base" />
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" loading={busy} onClick={() => input.current?.click()}>
            {!busy && <ImagePlus aria-hidden />} {logo ? "Replace logo" : "Upload logo"}
          </Button>
          {logo && (
            <Button variant="destructive-ghost" size="sm" disabled={busy} onClick={remove}>
              <Trash2 aria-hidden /> Remove
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">PNG, JPG, WEBP or SVG, up to 1 MB. Square images work best.</p>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

type ProfileValues = z.input<typeof profileSchema>;

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), defaultValues: { name, email } });

  async function onSubmit(values: ProfileValues) {
    try {
      await submit("/api/auth/profile", "PUT", values, setError);
      reset(values);
      toast.success("Profile updated");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Field id="profile-name" label="Name" error={errors.name?.message}>
        <Input id="profile-name" autoComplete="name" {...register("name")} aria-invalid={!!errors.name} />
      </Field>
      <Field id="profile-email" label="Login email" error={errors.email?.message}>
        <Input id="profile-email" type="email" autoComplete="email" {...register("email")} aria-invalid={!!errors.email} />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
          Update profile
        </Button>
      </div>
    </form>
  );
}

type PasswordValues = z.input<typeof passwordChangeSchema>;

export function PasswordForm() {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values: PasswordValues) {
    try {
      await submit("/api/auth/password", "POST", values, setError);
      reset();
      toast.success("Password changed. Other devices have been signed out.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Field id="currentPassword" label="Current password" error={errors.currentPassword?.message}>
        <Input id="currentPassword" type="password" autoComplete="current-password" {...register("currentPassword")} aria-invalid={!!errors.currentPassword} />
      </Field>
      <Field id="newPassword" label="New password" hint="At least 10 characters, with a letter and a number." error={errors.newPassword?.message}>
        <Input id="newPassword" type="password" autoComplete="new-password" {...register("newPassword")} aria-invalid={!!errors.newPassword} />
      </Field>
      <Field id="confirmPassword" label="Confirm new password" error={errors.confirmPassword?.message}>
        <Input id="confirmPassword" type="password" autoComplete="new-password" {...register("confirmPassword")} aria-invalid={!!errors.confirmPassword} />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting}>
          Change password
        </Button>
      </div>
    </form>
  );
}
