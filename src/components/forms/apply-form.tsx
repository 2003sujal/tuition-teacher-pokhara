"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileText, UploadCloud, RefreshCw, X, ShieldCheck, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { applicationFieldsSchema } from "@/lib/validations";
import { checkCvMeta } from "@/lib/file-validation";
import { CV_ACCEPT_ATTR, CV_MAX_LABEL } from "@/lib/constants";
import { compressImage } from "@/lib/compress-image";
import { SubjectPicker } from "./subject-picker";
import { formatBytes, cn } from "@/lib/utils";

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
    <form onSubmit={(e) => handleSubmit(onSubmit)(e)} noValidate className="sf">
      {/* Honeypot: invisible to people, tempting to bots. */}
      <div aria-hidden className="sf-honeypot">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="sf-row">
        <div className="sf-field">
          <label className="sf-label" htmlFor="fullName">
            Full name <span className="sf-req" aria-hidden>*</span>
          </label>
          <input
            className="sf-input"
            id="fullName"
            autoComplete="name"
            placeholder="Enter your full name"
            aria-required="true"
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? "fullName-error" : undefined}
            {...register("fullName")}
          />
          <FieldMessage id="fullName-error" error={errors.fullName?.message} />
        </div>

        <div className="sf-field">
          <label className="sf-label" htmlFor="mobileNumber">
            Mobile number <span className="sf-req" aria-hidden>*</span>
          </label>
          <div className="sf-prefixed">
            <span className="sf-prefix" aria-hidden>+977</span>
            <input
              className="sf-input"
              id="mobileNumber"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="Enter your mobile number"
              aria-required="true"
              aria-invalid={!!errors.mobileNumber}
              aria-describedby="mobileNumber-hint"
              {...register("mobileNumber")}
            />
          </div>
          <FieldMessage id="mobileNumber-hint" error={errors.mobileNumber?.message} hint="10-digit number, e.g. 98XXXXXXXX" />
        </div>
      </div>

      <div className="sf-field">
        <label className="sf-label" htmlFor="location">
          Current location <span className="sf-req" aria-hidden>*</span>
        </label>
        <input
          className="sf-input"
          id="location"
          autoComplete="address-level2"
          placeholder="Example: Lakeside, Pokhara"
          aria-required="true"
          aria-invalid={!!errors.location}
          aria-describedby={errors.location ? "location-error" : undefined}
          {...register("location")}
        />
        <FieldMessage id="location-error" error={errors.location?.message} />
      </div>

      <Controller
        control={control}
        name="subjects"
        render={({ field }) => (
          <div className="sf-field sf-subjects">
            <label className="sf-label" id="subjects-label" htmlFor="subjects">
              Subjects you can teach <span className="sf-req" aria-hidden>*</span>
            </label>
            <p id="subjects-hint" className="sf-hint">
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
            <FieldMessage error={errors.subjects?.message ?? errors.subjects?.root?.message} />
          </div>
        )}
      />

      <Controller
        control={control}
        name="cv"
        render={({ field }) => {
          const file = field.value as File | null;
          return (
            <div className="sf-field">
              <label className="sf-label" htmlFor="cv">
                Upload CV / Resume <span className="sf-req" aria-hidden>*</span>
              </label>
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
                <div className="sf-drop sf-drop--busy" role="status">
                  <Loader2 className="sf-spin" aria-hidden /> Preparing your photo…
                </div>
              ) : file ? (
                <div className={cn("sf-file", errors.cv && "is-invalid")}>
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="Preview of your CV photo" className="sf-file__thumb" />
                  ) : (
                    <span className="sf-file__icon">
                      <FileText aria-hidden />
                    </span>
                  )}
                  <div className="sf-file__meta">
                    <p className="sf-file__name" title={file.name}>
                      {file.name}
                    </p>
                    <p className="sf-file__size">{formatBytes(file.size)}</p>
                  </div>
                  <button type="button" className="sf-btn sf-btn--ghost" onClick={() => fileInput.current?.click()}>
                    <RefreshCw aria-hidden />
                    Replace
                  </button>
                  <button type="button" className="sf-btn sf-btn--ghost sf-btn--icon" aria-label="Remove file" onClick={clearFile}>
                    <X aria-hidden />
                  </button>
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
                  className={cn("sf-drop", dragging && "is-dragging", errors.cv && "is-invalid")}
                >
                  <UploadCloud className="sf-drop__icon" aria-hidden />
                  <span className="sf-drop__title">
                    Tap to choose a file<span className="sf-drop__drag"> or drag it here</span>
                  </span>
                  <span className="sf-drop__note">PDF, Word or a photo of your CV, up to {CV_MAX_LABEL}.</span>
                </button>
              )}
              {!file && !preparing && (
                <button type="button" className="sf-btn sf-camera" onClick={() => cameraInput.current?.click()}>
                  <Camera aria-hidden /> Take a photo of your CV
                </button>
              )}
              <FieldMessage error={errors.cv?.message as string | undefined} />
            </div>
          );
        }}
      />

      {serverError && (
        <div role="alert" className="sf-alert">
          {serverError}
        </div>
      )}

      <button type="submit" className="sf-btn sf-btn--primary sf-submit" disabled={submitting} aria-busy={submitting}>
        {submitting && <Loader2 className="sf-spin" aria-hidden />}
        {submitting ? "Submitting…" : "Submit Application"}
      </button>

      <p className="sf-privacy">
        <ShieldCheck aria-hidden />
        Your details and CV are stored securely and are only visible to the Tuition Teacher Pokhara team. We use
        them solely to contact you about tuition opportunities and never share them publicly.
      </p>
    </form>
  );
}

function FieldMessage({ id, error, hint }: { id?: string; error?: string; hint?: string }) {
  if (error)
    return (
      <p id={id} role="alert" className="sf-error">
        {error}
      </p>
    );
  if (hint)
    return (
      <p id={id} className="sf-hint">
        {hint}
      </p>
    );
  return null;
}
