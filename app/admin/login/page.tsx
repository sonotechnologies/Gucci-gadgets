import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/login-form";
import { Logo } from "@/components/logo";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Owner login", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="flex w-full max-w-sm flex-col gap-6 rounded-card border border-border bg-bg p-6 md:p-8">
        <div className="flex flex-col gap-2">
          <Logo size={26} />
          <h1 className="pt-3 text-h2 font-semibold">Owner login</h1>
          <p className="text-small text-muted">Sign in to manage products, prices and settings.</p>
        </div>
        <LoginForm next={next?.startsWith("/admin") ? next : "/admin"} demo={!isSupabaseConfigured} />
      </div>
    </div>
  );
}
