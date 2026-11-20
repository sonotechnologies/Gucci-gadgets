import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";

let client: SupabaseClient | null = null;

/** Cookie-less anon client for public catalogue reads (keeps pages static / ISR-friendly). */
export function publicClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  client ??= createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  return client;
}
