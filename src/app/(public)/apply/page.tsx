import type { Metadata } from "next";
import { Clock, FileCheck2, PhoneCall } from "lucide-react";
import { getSettings } from "@/lib/data/settings";
import { PublicShell } from "@/components/layout/public-shell";
import { ApplyForm } from "@/components/forms/apply-form";

export const metadata: Metadata = {
  title: "Register as a Tutor",
  description: "Join Tuition Teacher Pokhara. Submit your details and CV to become part of our tutor network.",
};

// Heading/description come from admin settings, so render per request.
export const dynamic = "force-dynamic";

const steps = [
  { icon: FileCheck2, title: "Submit once", text: "A few quick details and your CV." },
  { icon: Clock, title: "We review", text: "Our team keeps your profile on file." },
  { icon: PhoneCall, title: "We call you", text: "When a matching tuition opens up." },
];

export default async function ApplyPage() {
  const settings = await getSettings();

  return (
    <PublicShell settings={settings}>
      <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 pb-14 pt-2 sm:px-6 sm:pt-6 lg:grid-cols-[1fr_440px] lg:gap-14 lg:pt-12">
        <section className="lg:pt-6">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent-soft px-3 py-1 text-xs font-medium text-accent-foreground">
            <span className="size-1.5 rounded-full bg-accent" aria-hidden />
            Now accepting tutors across Pokhara
          </p>
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
            {settings.applicationHeading}
          </h1>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            {settings.applicationDescription}
          </p>

          <ol className="mt-8 hidden gap-5 lg:grid">
            {steps.map((s, i) => (
              <li key={s.title} className="flex items-start gap-3.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-surface text-primary shadow-card">
                  <s.icon className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold">
                    <span className="mr-1.5 text-subtle-foreground tabular">0{i + 1}</span>
                    {s.title}
                  </p>
                  <p className="text-sm text-muted-foreground">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-label="Tutor registration form"
          className="relative rounded-2xl border border-border bg-surface p-5 shadow-pop sm:p-7"
        >
          <ApplyForm />
        </section>
      </div>
    </PublicShell>
  );
}
