import type { Metadata } from "next";
import { PageTitle } from "@/components/admin/admin-ui";
import { SettingsForm } from "@/components/admin/settings-form";
import { adminSettings } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const settings = await adminSettings();
  return (
    <>
      <PageTitle>Settings</PageTitle>
      <SettingsForm settings={settings} />
    </>
  );
}
