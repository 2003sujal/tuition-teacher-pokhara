import { FACEBOOK_URL, TIKTOK_URL } from "@/lib/constants";

/** Facebook "f" mark (lucide no longer ships brand icons). */
export function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M13.5 21v-7.5h2.53l.38-2.94H13.5V8.69c0-.85.24-1.43 1.46-1.43h1.55V4.63A20.6 20.6 0 0 0 14.25 4.5c-2.24 0-3.77 1.37-3.77 3.88v2.18H7.95v2.94h2.53V21h3.02Z" />
    </svg>
  );
}

/** TikTok note mark. */
export function TikTokIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 0 1-2.59-2.59 2.59 2.59 0 0 1 3.36-2.48V9.68a5.7 5.7 0 0 0-.77-.05 5.68 5.68 0 0 0-5.68 5.68A5.68 5.68 0 0 0 9.86 21a5.68 5.68 0 0 0 5.68-5.68V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.28 4.28 0 0 1-3.24-1.48Z" />
    </svg>
  );
}

function FollowCard({
  href,
  title,
  text,
  icon,
  tone,
}: {
  href: string;
  title: string;
  text: string;
  icon: React.ReactNode;
  tone: "facebook" | "tiktok";
}) {
  return (
    <a className={`st-follow st-follow--${tone}`} href={href} target="_blank" rel="noopener noreferrer">
      <span className="st-follow__icon">{icon}</span>
      <span className="st-follow__text">
        <strong>{title}</strong>
        <span>{text}</span>
      </span>
    </a>
  );
}

/** "Follow us on Facebook" call-out for tutors on the public pages. */
export function FacebookFollow() {
  return (
    <FollowCard
      href={FACEBOOK_URL}
      tone="facebook"
      title="Follow us on Facebook"
      text="New tuition vacancies are posted on our page first."
      icon={<FacebookIcon />}
    />
  );
}

/** "Follow us on TikTok" call-out. */
export function TikTokFollow() {
  return (
    <FollowCard
      href={TIKTOK_URL}
      tone="tiktok"
      title="Follow us on TikTok"
      text="Tips, updates and new vacancies for tutors in Pokhara."
      icon={<TikTokIcon />}
    />
  );
}

/** Facebook, then TikTok below it. */
export function SocialFollow({ className }: { className?: string }) {
  return (
    <div className={`st-social ${className ?? ""}`}>
      <FacebookFollow />
      <TikTokFollow />
    </div>
  );
}
