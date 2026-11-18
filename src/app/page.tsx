import Link from "next/link";
import { ArrowRight, FileText, MapPin, Smartphone } from "lucide-react";
import { getSettings } from "@/lib/data/settings";
import { PublicShell } from "@/components/layout/public-shell";
import { SocialFollow } from "@/components/layout/social";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const points = [
  { icon: Smartphone, text: "Takes about a minute on your phone" },
  { icon: MapPin, text: "Get matched with students near you" },
  { icon: FileText, text: "Just your details, subjects and CV" },
];

export default async function HomePage() {
  const settings = await getSettings();
  return (
    <PublicShell settings={settings}>
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 pb-20 pt-10 text-center sm:pt-20">
        <h1 className="text-[32px] font-semibold leading-[1.15] tracking-tight sm:text-5xl">
          Teach with {settings.agencyName}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          We connect qualified tutors with students and families across Pokhara. Register once — we&apos;ll reach
          out when a tuition opportunity suits you.
        </p>
        <Button asChild size="lg" className="mt-8 w-full sm:w-auto">
          <Link href="/apply">
            Register as a Tutor
            <ArrowRight aria-hidden />
          </Link>
        </Button>
        <ul className="mt-10 grid w-full gap-3 text-left sm:grid-cols-3">
          {points.map((p) => (
            <li key={p.text} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 shadow-card">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                <p.icon className="size-4" aria-hidden />
              </span>
              <span className="text-sm text-foreground">{p.text}</span>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex w-full justify-center text-left">
          <SocialFollow />
        </div>
      </div>
    </PublicShell>
  );
}
