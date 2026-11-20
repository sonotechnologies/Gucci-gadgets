"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { browserClient } from "@/lib/supabase/browser";

const schema = z.object({ email: z.string().email("Enter a valid email"), password: z.string().min(6, "Password is at least 6 characters") });

export function LoginForm({ next, demo }: { next: string; demo: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (demo) {
    return (
      <div className="flex flex-col gap-4 text-small text-muted">
        <p>Supabase isn&rsquo;t connected yet, so the dashboard runs in read-only demo mode with no login.</p>
        <Link href="/admin" className="btn btn-primary btn-lg hover:no-underline">
          Open demo dashboard
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const r = schema.safeParse({ email, password });
        if (!r.success) return setError(r.error.issues[0].message);
        setBusy(true);
        setError(null);
        const { error: err } = await browserClient().auth.signInWithPassword(r.data);
        setBusy(false);
        if (err) return setError(err.message === "Invalid login credentials" ? "Wrong email or password." : err.message);
        router.replace(next);
        router.refresh();
      }}
      className="flex flex-col gap-4"
    >
      <label className="field">
        Email
        <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label className="field">
        Password
        <input className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>
      {error && (
        <p role="alert" className="text-small text-deal">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className="btn btn-primary btn-lg">
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
