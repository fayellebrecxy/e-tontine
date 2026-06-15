import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase avec la clé service role (privilèges admin).
 * À n'utiliser QUE côté serveur. Ne persiste pas de session.
 */
export function createSupabaseAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
