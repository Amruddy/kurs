export class SupabasePublicConfigError extends Error {
  readonly missingEnv: string[];

  constructor(missingEnv: string[]) {
    super(`Не настроены публичные переменные Supabase: ${missingEnv.join(", ")}`);
    this.name = "SupabasePublicConfigError";
    this.missingEnv = missingEnv;
  }
}

export function readSupabasePublicEnv() {
  const missingEnv: string[] = [];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url?.trim()) {
    missingEnv.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!publishableKey?.trim()) {
    missingEnv.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY или NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  if (missingEnv.length > 0) {
    throw new SupabasePublicConfigError(missingEnv);
  }

  return {
    publishableKey: publishableKey as string,
    url: url as string,
  };
}

export function getSupabaseAuthStorageKey(url: string) {
  return `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;
}

export function hasSupabaseAuthStorageCookie(cookies: { name: string }[], url: string) {
  const storageKey = getSupabaseAuthStorageKey(url);

  return cookies.some(({ name }) => name === storageKey || name.startsWith(`${storageKey}.`));
}
