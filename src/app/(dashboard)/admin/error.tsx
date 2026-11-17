"use client";

import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto mt-16 max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-card">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-danger-soft text-danger">
        <AlertTriangle className="size-5" aria-hidden />
      </span>
      <h2 className="mt-4 text-lg font-semibold">Something went wrong</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        We couldn&apos;t load this page. This is usually a temporary database or network issue.
      </p>
      {error.digest && <p className="mt-2 font-mono text-xs text-subtle-foreground">Ref: {error.digest}</p>}
      <Button className="mt-6" onClick={reset}>
        <RotateCw aria-hidden /> Try again
      </Button>
    </div>
  );
}
