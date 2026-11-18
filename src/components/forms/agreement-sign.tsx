"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CircleCheck, Loader2, Printer } from "lucide-react";

const CHECKS = [
  { name: "acceptCharges", text: "Yes, I understand and accept the service charges in Clause 2." },
  { name: "acceptDemo", text: "Yes, I understand and accept the demo class policy in Clause 3, including the deposit." },
  { name: "acceptConfidential", text: "Yes, I will keep this agreement confidential and will not discuss it with parents or students." },
  { name: "acceptAll", text: "I have read this agreement in full, I understand it, and I agree to follow it." },
] as const;

type CheckName = (typeof CHECKS)[number]["name"];

export function AgreementSign({ agencyName, companyName, today }: { agencyName: string; companyName: string; today: string }) {
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [checks, setChecks] = useState<Record<CheckName, boolean>>({
    acceptCharges: false,
    acceptDemo: false,
    acceptConfidential: false,
    acceptAll: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [notRegistered, setNotRegistered] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signed, setSigned] = useState<{ name: string; at: string } | null>(null);

  const allChecked = CHECKS.every((c) => checks[c.name]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError("");
    setNotRegistered(false);
    setSubmitting(true);
    try {
      const res = await fetch("/api/agreement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, mobileNumber: mobile, ...checks }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.fields) setErrors(data.fields);
        setNotRegistered(!!data.notRegistered);
        setFormError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSigned({
        name: fullName.trim(),
        at: new Intl.DateTimeFormat("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZone: "Asia/Kathmandu",
        }).format(new Date(data.acceptedAt)),
      });
    } catch {
      setFormError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="ag__signatures" aria-label="Signatures">
        <div className="ag__sig">
          <div className="ag__sig-space">
            <Image
              src="/STAMP.png"
              alt={`Official stamp of ${companyName}`}
              width={580}
              height={134}
              className="ag__stamp"
              sizes="240px"
            />
          </div>
          <p className="ag__sig-line">Authorised signatory</p>
          <p className="ag__sig-name">For {agencyName}</p>
          <p className="ag__sig-sub">{companyName}</p>
        </div>
        <div className="ag__sig">
          <div className="ag__sig-space">
            {signed ? <span className="ag__signature">{signed.name}</span> : <span className="ag__sig-pending">Awaiting signature</span>}
          </div>
          <p className="ag__sig-line">Tutor</p>
          <p className="ag__sig-name">{signed ? signed.name : "Name of the Tutor"}</p>
          <p className="ag__sig-sub">{signed ? `Accepted ${signed.at}` : `Date: ${today}`}</p>
        </div>
      </section>

      {signed ? (
        <div className="ag__done" role="status">
          <CircleCheck aria-hidden />
          <div>
            <p className="ag__done-title">Agreement accepted. Thank you, {signed.name.split(" ")[0]}!</p>
            <p>
              Your acceptance has been recorded on {signed.at}. Our team will contact you about tuition opportunities.
              You can print or save this page as a PDF for your records.
            </p>
            <button type="button" className="sf-btn ag__print" onClick={() => window.print()}>
              <Printer aria-hidden /> Print / Save as PDF
            </button>
          </div>
        </div>
      ) : (
        <form className="ag__form sf" onSubmit={submit} noValidate>
          <h2>Sign this agreement</h2>
          <p className="ag__form-lead">Use the same name and mobile number you registered with.</p>
          <div className="sf-row">
            <div className="sf-field">
              <label className="sf-label" htmlFor="ag-name">
                Full name <span className="sf-req">*</span>
              </label>
              <input
                id="ag-name"
                className="sf-input"
                autoComplete="name"
                maxLength={100}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                aria-invalid={!!errors.fullName}
              />
              <p className="sf-error">{errors.fullName}</p>
            </div>
            <div className="sf-field">
              <label className="sf-label" htmlFor="ag-mobile">
                Registered mobile number <span className="sf-req">*</span>
              </label>
              <div className="sf-prefixed">
                <span className="sf-prefix">+977</span>
                <input
                  id="ag-mobile"
                  className="sf-input"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="98XXXXXXXX"
                  maxLength={20}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  aria-invalid={!!errors.mobileNumber}
                />
              </div>
              <p className="sf-error">{errors.mobileNumber}</p>
            </div>
          </div>

          <fieldset className="ag__checks">
            <legend className="sf-label">Please confirm each statement</legend>
            {CHECKS.map((c) => (
              <label key={c.name} className={`ag__check ${checks[c.name] ? "is-on" : ""}`}>
                <input
                  type="checkbox"
                  checked={checks[c.name]}
                  onChange={(e) => setChecks((s) => ({ ...s, [c.name]: e.target.checked }))}
                />
                <span>{c.text}</span>
              </label>
            ))}
          </fieldset>

          {formError && (
            <p className="ag__error" role="alert">
              {formError}{" "}
              {notRegistered && (
                <Link href="/apply" className="ag__link">
                  Register as a tutor
                </Link>
              )}
            </p>
          )}

          <button type="submit" className="sf-btn sf-btn--primary sf-submit" disabled={!allChecked || submitting} aria-busy={submitting}>
            {submitting && <Loader2 className="sf-spin" aria-hidden />}
            {submitting ? "Submitting…" : "I Agree & Sign"}
          </button>
          {!allChecked && <p className="sf-hint">Tick all four statements to sign.</p>}
        </form>
      )}
    </>
  );
}
