import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Home } from "lucide-react";
import { getSettings } from "@/lib/data/settings";
import { PublicShell } from "@/components/layout/public-shell";
import { Button } from "@/components/ui/button";
import { CopyText } from "@/components/forms/copy-text";
import { FacebookFollow } from "@/components/layout/social";

export const metadata: Metadata = { title: "Application Submitted", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function SuccessPage({ searchParams }: PageProps<"/application-success">) {
  const { ref } = await searchParams;
  // Only display references that look like ours.
  const reference = typeof ref === "string" && /^TTP-\d{4}-\d{5,}$/.test(ref) ? ref : null;
  const settings = await getSettings();

  return (
    <PublicShell settings={settings}>
      <div className="mx-auto w-full max-w-lg px-4 pb-16 pt-6 sm:pt-12">
        <div className="rounded-2xl border border-border bg-surface p-6 text-center shadow-pop sm:p-9">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/60">
            <CheckCircle2 className="size-7 text-emerald-600" aria-hidden />
          </span>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">Application Submitted Successfully!</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Thank you for registering with {settings.agencyName}. Your details and CV have been received. We will
            contact you if a suitable tuition opportunity becomes available.
          </p>

          {reference && (
            <div className="mt-6 rounded-xl border border-dashed border-border-strong bg-surface-muted px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Application reference number
              </p>
              <div className="mt-1.5 flex items-center justify-center gap-2">
                <span className="font-mono text-xl font-semibold tracking-wide text-foreground">{reference}</span>
                <CopyText value={reference} label="Copy reference number" />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">Please keep this number for future reference.</p>
            </div>
          )}

          <div className="mt-6 flex justify-center text-left">
            <FacebookFollow />
          </div>

          <Button asChild size="lg" className="mt-7 w-full sm:w-auto">
            <Link href="/">
              <Home aria-hidden />
              Return to main page
            </Link>
          </Button>
        </div>
      </div>
    </PublicShell>
  );
}
