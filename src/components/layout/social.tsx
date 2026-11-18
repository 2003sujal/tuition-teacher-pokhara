import { FACEBOOK_URL } from "@/lib/constants";

/** Facebook "f" mark (lucide no longer ships brand icons). */
export function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M13.5 21v-7.5h2.53l.38-2.94H13.5V8.69c0-.85.24-1.43 1.46-1.43h1.55V4.63A20.6 20.6 0 0 0 14.25 4.5c-2.24 0-3.77 1.37-3.77 3.88v2.18H7.95v2.94h2.53V21h3.02Z" />
    </svg>
  );
}

/** "Follow us on Facebook" call-out for tutors on the public pages. */
export function FacebookFollow({ className }: { className?: string }) {
  return (
    <a className={`st-follow ${className ?? ""}`} href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">
      <span className="st-follow__icon">
        <FacebookIcon />
      </span>
      <span className="st-follow__text">
        <strong>Follow us on Facebook</strong>
        <span>New tuition vacancies are posted on our page first.</span>
      </span>
    </a>
  );
}
