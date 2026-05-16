type SupabasePublicConfig = {
  publishableKey: string;
  url: string;
};

function readPublicKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = readPublicKey();

  if (!url || !publishableKey) {
    return null;
  }

  return { publishableKey, url };
}

export function requireSupabasePublicConfig() {
  const config = getSupabasePublicConfig();

  if (!config) {
    throw new Error(
      "Supabase public env is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return config;
}
