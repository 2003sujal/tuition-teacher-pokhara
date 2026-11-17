import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";
import { BrandLogo } from "./brand";
import type { AgencySettings } from "@/lib/constants";

export function PublicShell({ settings, children }: { settings: AgencySettings; children: React.ReactNode }) {
  const year = new Date().getFullYear();
  return (
    <div className="flex min-h-dvh flex-col bg-[radial-gradient(1200px_500px_at_50%_-120px,#e9eff8,transparent)]">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="rounded-lg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <BrandLogo name={settings.agencyName} logo={settings.logo} className="h-16 sm:h-24" />
        </Link>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-surface/70">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-6 text-[13px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            © {year} {settings.agencyName}. All rights reserved.
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-1.5">
            {settings.contactNumber && (
              <li className="flex items-center gap-1.5">
                <Phone className="size-3.5" aria-hidden />
                <a href={`tel:${settings.contactNumber.replace(/\s/g, "")}`} className="hover:text-foreground">
                  {settings.contactNumber}
                </a>
              </li>
            )}
            {settings.contactEmail && (
              <li className="flex items-center gap-1.5">
                <Mail className="size-3.5" aria-hidden />
                <a href={`mailto:${settings.contactEmail}`} className="hover:text-foreground">
                  {settings.contactEmail}
                </a>
              </li>
            )}
            {settings.address && (
              <li className="flex items-center gap-1.5">
                <MapPin className="size-3.5" aria-hidden />
                {settings.address}
              </li>
            )}
          </ul>
        </div>
      </footer>
    </div>
  );
}
