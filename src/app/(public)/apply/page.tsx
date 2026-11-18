import type { Metadata } from "next";
import { CircleCheck } from "lucide-react";
import { getSettings } from "@/lib/data/settings";
import { PublicShell } from "@/components/layout/public-shell";
import { ApplyForm } from "@/components/forms/apply-form";
import { FacebookFollow } from "@/components/layout/social";

export const metadata: Metadata = {
  title: "Register as a Tutor",
  description: "Join Tuition Teacher Pokhara. Submit your details and CV to become part of our tutor network.",
};

// Heading/description come from admin settings, so render per request.
export const dynamic = "force-dynamic";

const steps = [
  { title: "Submit once", text: "A few quick details and your CV." },
  { title: "We review", text: "Our team keeps your profile on file." },
  { title: "We call you", text: "When a matching tuition opens up." },
];

export default async function ApplyPage() {
  const settings = await getSettings();

  return (
    <PublicShell settings={settings}>
      <div className="ap">
        <div className="st-container ap__grid">
          <section className="ap__brief" aria-labelledby="apply-title">
            <h1 id="apply-title">{settings.applicationHeading}</h1>
            <p className="ap__lead">{settings.applicationDescription}</p>
            <p className="ap__status">
              <CircleCheck aria-hidden />
              Now accepting tutors across Pokhara
            </p>
            <FacebookFollow />
          </section>

          <section className="ap__sheet" aria-label="Tutor registration form">
            <ApplyForm />
          </section>

          <ol className="ap__steps" aria-label="What happens next">
            {steps.map((s) => (
              <li key={s.title}>
                <h2>{s.title}</h2>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </PublicShell>
  );
}
