import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { readSupabasePublicEnv, SupabasePublicConfigError } from "@/app/lib/supabase/env";

const requiredEnvNames = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const;
const defaultSupabaseFetchTimeoutMs = 5_000;

export class SupabaseRequestTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Supabase не ответил за ${timeoutMs} мс. Проверьте доступность Supabase и значения .env.local.`);
    this.name = "SupabaseRequestTimeoutError";
  }
}

export function readSupabaseRequestTimeoutMs() {
  const value = Number.parseInt(process.env.SUPABASE_FETCH_TIMEOUT_MS ?? "", 10);

  return Number.isFinite(value) && value > 0 ? value : defaultSupabaseFetchTimeoutMs;
}

const noStoreFetch: typeof fetch = async (input, init) => {
  const timeoutMs = readSupabaseRequestTimeoutMs();
  const controller = new AbortController();
  const callerSignal = init?.signal;
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const abortFromCaller = () => controller.abort();

  if (callerSignal?.aborted) {
    controller.abort();
  } else {
    callerSignal?.addEventListener("abort", abortFromCaller, { once: true });
  }

  try {
    return await fetch(input, { ...init, cache: "no-store", signal: controller.signal });
  } catch (error) {
    if (timedOut) {
      throw new SupabaseRequestTimeoutError(timeoutMs);
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
    callerSignal?.removeEventListener("abort", abortFromCaller);
  }
};

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

  try {
    readSupabasePublicEnv();
  } catch (error) {
    if (error instanceof SupabasePublicConfigError) {
      missingEnv.push(...error.missingEnv.filter((name) => !missingEnv.includes(name as (typeof requiredEnvNames)[number])));
    } else {
      throw error;
    }
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
    global: {
      fetch: noStoreFetch,
    },
  });
}

export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const { publishableKey, url } = readSupabasePublicEnv();
  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, options, value }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot always write cookies; proxy.ts refreshes auth cookies.
        }
      },
    },
    global: {
      fetch: noStoreFetch,
    },
  });
}
