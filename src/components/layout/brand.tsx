/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";

const DEFAULT_LOGO = "/logo.png"; // full logo: mark + "Tuition Teacher Pokhara" + tagline
const DEFAULT_MARK = "/logo-mark.png"; // square icon mark

/** Square icon. Uses the uploaded logo from Settings when present, otherwise the built-in mark. */
export function BrandMark({ logo, className }: { logo?: string; className?: string }) {
  return (
    <img
      src={logo || DEFAULT_MARK}
      alt=""
      width={36}
      height={36}
      className={cn("size-9 shrink-0 object-contain", className)}
    />
  );
}

/** Full logo lockup for public pages and the login screen. */
export function BrandLogo({ logo, name, className }: { logo?: string; name: string; className?: string }) {
  return (
    <img
      src={logo || DEFAULT_LOGO}
      alt={name}
      width={1314}
      height={908}
      className={cn("h-16 w-auto object-contain", className)}
    />
  );
}

export function Brand({ name, logo, subtitle }: { name: string; logo?: string; subtitle?: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <BrandMark logo={logo} />
      <span className="flex flex-col leading-tight">
        <span className="text-[15px] font-semibold tracking-tight text-foreground">{name}</span>
        {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
      </span>
    </span>
  );
}
