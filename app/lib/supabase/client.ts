"use client";

import { createBrowserClient } from "@supabase/ssr";
import { requireSupabasePublicConfig } from "@/app/lib/supabase/public-env";

export function createSupabaseBrowserClient() {
  const { publishableKey, url } = requireSupabasePublicConfig();

  return createBrowserClient(url, publishableKey);
}
