import Link from "next/link";
import { Phone, Mail, MapPin, Globe } from "lucide-react";
import { BrandLogo } from "./brand";
import type { AgencySettings } from "@/lib/constants";
import "./public-studio.css";

// The public pages share the website's Studio system (scoped to .studio).
// Fonts come from the root layout: Geist everywhere.

export function PublicShell({ settings, children }: { settings: AgencySettings; children: React.ReactNode }) {
  const year = new Date().getFullYear();
  return (
    <div className="studio">
      <header className="st-header">
        <div className="st-container">
          <Link href="/" className="st-logo">
            <BrandLogo name={settings.agencyName} logo={settings.logo} className="h-auto" />
          </Link>
          <a className="st-btn" href="/website">
            <Globe aria-hidden />
            Website
          </a>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="st-footer">
        <div className="st-container">
          <p>
            © {year} {settings.agencyName}
          </p>
          <ul>
            {settings.contactNumber && (
              <li>
                <Phone aria-hidden />
                <a href={`tel:${settings.contactNumber.replace(/\s/g, "")}`}>{settings.contactNumber}</a>
              </li>
            )}
            {settings.contactEmail && (
              <li>
                <Mail aria-hidden />
                <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
              </li>
            )}
            {settings.address && (
              <li>
                <MapPin aria-hidden />
                {settings.address}
              </li>
            )}
          </ul>
        </div>
      </footer>
    </div>
  );
}
