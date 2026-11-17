"use client";

import { useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

async function copy(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    // Fallback for older mobile browsers / non-secure contexts.
    const el = document.createElement("textarea");
    el.value = value;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    el.remove();
    return ok;
  }
}

export function CopyText({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      title={label}
      onClick={async () => {
        if (await copy(value)) {
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        }
      }}
    >
      {done ? <Check className="text-emerald-600" /> : <Copy />}
    </Button>
  );
}

export function CopyLinkButton({
  url,
  variant = "default",
  className,
}: {
  url: string;
  variant?: "default" | "secondary" | "soft";
  className?: string;
}) {
  const [done, setDone] = useState(false);
  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      onClick={async () => {
        if (await copy(url)) {
          setDone(true);
          toast.success("Registration link copied", { description: url });
          setTimeout(() => setDone(false), 2000);
        } else {
          toast.error("Could not copy. Please copy the link manually.");
        }
      }}
    >
      {done ? <Check aria-hidden /> : <Link2 aria-hidden />}
      {done ? "Link copied" : "Copy Registration Link"}
    </Button>
  );
}
