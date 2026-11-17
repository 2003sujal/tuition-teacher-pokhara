import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="text-center">
        <p className="font-mono text-sm text-muted-foreground">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist or was removed.</p>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild variant="secondary">
            <Link href="/">Home</Link>
          </Button>
          <Button asChild>
            <Link href="/apply">Register as a Tutor</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
