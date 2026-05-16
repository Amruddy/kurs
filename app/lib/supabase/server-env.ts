import "server-only";

import { getSupabasePublicConfig, requireSupabasePublicConfig } from "@/app/lib/supabase/public-env";

type SupabaseAdminConfig = {
  secretKey: string;
  url: string;
};

function readSecretKey() {
  return process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export function getSupabaseAdminConfig(): SupabaseAdminConfig | null {
  const publicConfig = getSupabasePublicConfig();
  const secretKey = readSecretKey();

  if (!publicConfig || !secretKey) {
    return null;
  }

  return { secretKey, url: publicConfig.url };
}

export function requireSupabaseAdminConfig() {
  const config = getSupabaseAdminConfig();

  if (!config) {
    throw new Error(
      "Supabase admin env is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.",
    );
  }

  return config;
}

export function requireSupabaseServerConfig() {
  return requireSupabasePublicConfig();
}

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
