import { Info } from "lucide-react";
import type { Metadata } from "next";
import { AdminBottomTabs, AdminMobileTop, AdminSidebar } from "@/components/admin/admin-nav";
import { AdminToast } from "@/components/admin/admin-ui";
import { adminUserEmail } from "@/lib/admin/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const demo = !isSupabaseConfigured;
  const email = await adminUserEmail();
  return (
    <div className="flex min-h-screen bg-surface">
      <AdminSidebar email={email} demo={demo} />
      <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 pb-28 pt-4 md:px-8 md:pb-10 md:pt-8">
        <AdminMobileTop demo={demo} />
        {demo && (
          <div role="status" className="flex max-w-[1100px] items-start gap-3 rounded-card border border-warning bg-bg p-4 text-small">
            <Info size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-warning" />
            <span>
              <span className="font-medium">Demo mode.</span> You&rsquo;re seeing the placeholder catalogue and changes won&rsquo;t be saved. Add the Supabase keys
              (see README) to switch on login and live editing.
            </span>
          </div>
        )}
        <div className="flex w-full max-w-[1100px] flex-col gap-6">{children}</div>
      </main>
      <AdminBottomTabs />
      <AdminToast />
    </div>
  );
}
