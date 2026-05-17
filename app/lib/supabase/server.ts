import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const requiredEnvNames = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const;

export class SupabaseServerConfigError extends Error {
  readonly missingEnv: string[];

  constructor(missingEnv: string[]) {
    super(`Не настроены переменные Supabase: ${missingEnv.join(", ")}`);
    this.name = "SupabaseServerConfigError";
    this.missingEnv = missingEnv;
  }
}

function readSupabaseEnv() {
  const missingEnv: string[] = requiredEnvNames.filter((name) => !process.env[name]?.trim());
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!publicKey?.trim()) {
    missingEnv.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY или NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  if (missingEnv.length > 0) {
    throw new SupabaseServerConfigError([...missingEnv]);
  }

  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  };
}

export function createSupabaseAdminClient(): SupabaseClient {
  const { url, serviceRoleKey } = readSupabaseEnv();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
