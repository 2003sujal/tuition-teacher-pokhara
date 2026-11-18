import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, MapPin, Globe } from "lucide-react";
import { BrandLogo } from "./brand";
import { FacebookIcon } from "./social";
import { COMPANY, FACEBOOK_URL, type AgencySettings } from "@/lib/constants";
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
            <li>
              <a className="st-fb" href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">
                Follow us on Facebook
                <FacebookIcon />
              </a>
            </li>
          </ul>
        </div>

        <div className="st-container st-company">
          <a className="st-company__logo" href={COMPANY.website} target="_blank" rel="noopener" title={COMPANY.name}>
            <Image src={COMPANY.logo} alt={COMPANY.name} width={2170} height={725} sizes="150px" />
          </a>
        </div>
      </footer>
    </div>
  );
}
