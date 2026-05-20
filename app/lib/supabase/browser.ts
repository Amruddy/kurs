"use client";

import { createBrowserClient } from "@supabase/ssr";
import { readSupabasePublicEnv } from "@/app/lib/supabase/env";

export function createSupabaseBrowserClient() {
  const { publishableKey, url } = readSupabasePublicEnv();

  return createBrowserClient(url, publishableKey);
}
