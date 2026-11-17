import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/data/settings";
import { connectDB } from "@/lib/mongodb";
import { Tutor } from "@/models/Tutor";
import { AdminShell } from "@/components/layout/admin-shell";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();
  await connectDB();
  const [settings, newCount] = await Promise.all([getSettings(), Tutor.countDocuments({ status: "New" })]);

  return (
    <Suspense>
      <AdminShell admin={admin} agencyName={settings.agencyName} logo={settings.logo} newCount={newCount}>
        {children}
      </AdminShell>
    </Suspense>
  );
}
