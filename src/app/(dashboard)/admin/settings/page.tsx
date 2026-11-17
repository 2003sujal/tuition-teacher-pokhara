import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getSettings, registrationLink } from "@/lib/data/settings";
import { getAppUrl } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AgencySettingsForm, LogoUploader, PasswordForm, ProfileForm } from "@/components/forms/settings-forms";
import { CopyLinkButton } from "@/components/forms/copy-text";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const admin = await requireAdmin();
  const settings = await getSettings();
  const link = registrationLink(settings);

  return (
    <>
      <PageHeader title="Settings" description="Manage your agency details, the public registration form and your account." />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Agency logo</CardTitle>
                <CardDescription>Shown on the registration page and in the admin panel.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <LogoUploader logo={settings.logo} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Agency &amp; registration form</CardTitle>
                <CardDescription>Changes appear on the public form immediately.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <AgencySettingsForm initial={settings} defaultLink={`${getAppUrl()}/apply`} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Registration link</CardTitle>
                <CardDescription>Share this with tutors on WhatsApp, Facebook or SMS.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="break-all rounded-lg border border-border bg-surface-muted px-3 py-2.5 font-mono text-[13px]">{link}</p>
              <CopyLinkButton url={link} className="w-full" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Admin profile</CardTitle>
                <CardDescription>Your name appears in the status history.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ProfileForm name={admin.name} email={admin.email} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Change password</CardTitle>
                <CardDescription>Changing your password signs out all other sessions.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <PasswordForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
