import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { getCurrentAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/data/settings";
import { BrandLogo } from "@/components/layout/brand";
import { LoginForm } from "@/components/forms/login-form";

export const metadata: Metadata = { title: "Admin Login", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function safeNext(value: unknown) {
  return typeof value === "string" && /^\/admin(\/[\w\-/]*)?$/.test(value) ? value : "/admin/dashboard";
}

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const { next } = await searchParams;
  const target = safeNext(next);

  const admin = await getCurrentAdmin().catch(() => null);
  if (admin) redirect(target);

  const settings = await getSettings();

  return (
    <div className="grid min-h-dvh place-items-center bg-[radial-gradient(900px_420px_at_50%_-80px,#e9eff8,transparent)] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex justify-center">
          <BrandLogo name={settings.agencyName} logo={settings.logo} className="h-32" />
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-pop sm:p-7">
          <div className="mb-6">
            <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">Access the tutor database and applications.</p>
          </div>
          <LoginForm next={target} />
        </div>
        <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-subtle-foreground">
          <Lock className="size-3" aria-hidden />
          Authorised personnel only
        </p>
      </div>
    </div>
  );
}
