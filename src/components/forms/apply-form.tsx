"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileText, UploadCloud, RefreshCw, X, ShieldCheck, ArrowRight, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { applicationFieldsSchema } from "@/lib/validations";
import { checkCvMeta } from "@/lib/file-validation";
import { CV_ACCEPT_ATTR, CV_MAX_LABEL } from "@/lib/constants";
import { compressImage } from "@/lib/compress-image";
import { SubjectPicker } from "./subject-picker";
import { formatBytes, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";

const formSchema = applicationFieldsSchema.extend({
  cv: z
    .custom<File | null>((v) => v === null || (typeof File !== "undefined" && v instanceof File))
    .superRefine((file, ctx) => {
      if (!file) {
        ctx.addIssue({ code: "custom", message: "Please upload your CV / resume" });
        return;
      }
      const check = checkCvMeta(file);
      if (!check.ok) ctx.addIssue({ code: "custom", message: check.error });
    }),
});

type FormValues = z.input<typeof formSchema>;

export function ApplyForm() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const startedAt = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { fullName: "", mobileNumber: "", location: "", subjects: [], cv: null },
    mode: "onTouched",
  });

  function setPreviewFor(file: File | null) {
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return file && file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
    });
  }

  async function pickFile(picked: File | undefined) {
    if (!picked) return;
    let file = picked;
    if (picked.type.startsWith("image/")) {
      // Shrink large phone photos so they fit the upload limit.
      setPreparing(true);
      file = await compressImage(picked);
      setPreparing(false);
    }
    setPreviewFor(file);
    setValue("cv", file, { shouldValidate: true, shouldDirty: true });
  }

  function clearFile() {
    setPreviewFor(null);
    setValue("cv", null, { shouldValidate: true });
  }

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setSubmitting(true);
    try {
      const body = new FormData();
      body.set("fullName", values.fullName);
      body.set("mobileNumber", values.mobileNumber);
      body.set("location", values.location);
      for (const s of values.subjects) body.append("subjects", s);
      body.set("cv", values.cv as File);
      body.set("website", (document.getElementById("website") as HTMLInputElement | null)?.value ?? "");
      body.set("elapsed", String(Date.now() - startedAt.current));

      const res = await fetch("/api/applications", { method: "POST", body });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.fields) {
          for (const [field, message] of Object.entries(data.fields as Record<string, string>)) {
            if (field in values) setError(field as keyof FormValues, { message });
          }
        }
        setServerError(data.error ?? "Something went wrong. Please try again.");
        toast.error(data.error ?? "Could not submit your application");
        return;
      }

      router.push(`/application-success?ref=${encodeURIComponent(data.applicationId)}`);
    } catch {
      setServerError("Network error. Please check your internet connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(e) => handleSubmit(onSubmit)(e)} noValidate className="space-y-5">
      {/* Honeypot: invisible to people, tempting to bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="fullName">
          Full name <span className="text-danger">*</span>
        </Label>
        <Input
          id="fullName"
          autoComplete="name"
          placeholder="Enter your full name"
          className="h-12 text-base sm:h-11 sm:text-sm"
          aria-invalid={!!errors.fullName}
          aria-describedby={errors.fullName ? "fullName-error" : undefined}
          {...register("fullName")}
        />
        <FieldError id="fullName-error">{errors.fullName?.message}</FieldError>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="mobileNumber">
          Mobile number <span className="text-danger">*</span>
        </Label>
        <div className="flex">
          <span className="inline-flex items-center rounded-l-lg border border-r-0 border-border-strong bg-surface-muted px-3 text-sm font-medium text-muted-foreground">
            +977
          </span>
          <Input
            id="mobileNumber"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="Enter your mobile number"
            className="h-12 rounded-l-none text-base sm:h-11 sm:text-sm"
            aria-invalid={!!errors.mobileNumber}
            aria-describedby="mobileNumber-hint"
            {...register("mobileNumber")}
          />
        </div>
        {errors.mobileNumber ? (
          <FieldError id="mobileNumber-hint">{errors.mobileNumber.message}</FieldError>
        ) : (
          <p id="mobileNumber-hint" className="text-[13px] text-subtle-foreground">
            10-digit number, e.g. 98XXXXXXXX
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="location">
          Current location <span className="text-danger">*</span>
        </Label>
        <Input
          id="location"
          autoComplete="address-level2"
          placeholder="Example: Lakeside, Pokhara"
          className="h-12 text-base sm:h-11 sm:text-sm"
          aria-invalid={!!errors.location}
          aria-describedby={errors.location ? "location-error" : undefined}
          {...register("location")}
        />
        <FieldError id="location-error">{errors.location?.message}</FieldError>
      </div>

      <Controller
        control={control}
        name="subjects"
        render={({ field }) => (
          <div className="space-y-1.5">
            <Label id="subjects-label" htmlFor="subjects">
              Subjects you can teach <span className="text-danger">*</span>
            </Label>
            <p id="subjects-hint" className="text-[13px] text-subtle-foreground">
              Tap all that apply, or add your own.
            </p>
            <SubjectPicker
              id="subjects"
              value={field.value ?? []}
              onChange={(next) => {
                field.onChange(next);
                field.onBlur();
              }}
              invalid={!!errors.subjects}
              describedBy="subjects-hint"
            />
            <FieldError>{errors.subjects?.message ?? errors.subjects?.root?.message}</FieldError>
          </div>
        )}
      />

      <Controller
        control={control}
        name="cv"
        render={({ field }) => {
          const file = field.value as File | null;
          return (
            <div className="space-y-1.5">
              <Label htmlFor="cv">
                Upload CV / Resume <span className="text-danger">*</span>
              </Label>
              <input
                ref={fileInput}
                id="cv"
                type="file"
                accept={CV_ACCEPT_ATTR}
                className="sr-only"
                aria-invalid={!!errors.cv}
                onChange={(e) => {
                  pickFile(e.target.files?.[0]);
                  e.target.value = ""; // allow re-selecting the same file
                }}
              />
              <input
                ref={cameraInput}
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                tabIndex={-1}
                aria-hidden
                onChange={(e) => {
                  pickFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              {preparing ? (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface px-4 py-8 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" aria-hidden /> Preparing your photo…
                </div>
              ) : file ? (
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-xl border bg-surface p-3",
                    errors.cv ? "border-danger" : "border-border-strong"
                  )}
                >
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="Preview of your CV photo" className="size-12 shrink-0 rounded-lg border border-border object-cover" />
                  ) : (
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                      <FileText className="size-5" aria-hidden />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => fileInput.current?.click()}>
                    <RefreshCw aria-hidden />
                    Replace
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove file"
                    onClick={clearFile}
                  >
                    <X />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    pickFile(e.dataTransfer.files?.[0]);
                  }}
                  className={cn(
                    "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    dragging ? "border-primary bg-primary-soft" : "border-border-strong bg-surface hover:border-primary/60 hover:bg-primary-soft/40",
                    errors.cv && "border-danger"
                  )}
                >
                  <span className="grid size-11 place-items-center rounded-full bg-primary-soft text-primary">
                    <UploadCloud className="size-5" aria-hidden />
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    <span className="text-primary">Tap to choose a file</span>
                    <span className="hidden sm:inline"> or drag it here</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    PDF, Word or a photo of your CV · up to {CV_MAX_LABEL}
                  </span>
                </button>
              )}
              {!file && !preparing && (
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full sm:hidden"
                  onClick={() => cameraInput.current?.click()}
                >
                  <Camera aria-hidden /> Take a photo of your CV
                </Button>
              )}
              <FieldError>{errors.cv?.message as string | undefined}</FieldError>
            </div>
          );
        }}
      />

      {serverError && (
        <div role="alert" className="rounded-lg border border-danger/25 bg-danger-soft px-3.5 py-3 text-sm text-danger">
          {serverError}
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" loading={submitting}>
        {submitting ? "Submitting…" : "Submit Application"}
        {!submitting && <ArrowRight aria-hidden />}
      </Button>

      <p className="flex items-start gap-2 text-[13px] leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
        Your details and CV are stored securely and are only visible to the Tuition Teacher Pokhara team. We use
        them solely to contact you about tuition opportunities and never share them publicly.
      </p>
    </form>
  );
}
