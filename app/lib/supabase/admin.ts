import "server-only";

import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAdminConfig } from "@/app/lib/supabase/server-env";

export function createSupabaseAdminClient() {
  const { secretKey, url } = requireSupabaseAdminConfig();

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
