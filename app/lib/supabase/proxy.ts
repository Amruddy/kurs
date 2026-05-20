import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseAuthStorageCookie, readSupabasePublicEnv, SupabasePublicConfigError } from "@/app/lib/supabase/env";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  try {
    const { publishableKey, url } = readSupabasePublicEnv();

    if (!hasSupabaseAuthStorageCookie(request.cookies.getAll(), url)) {
      return response;
    }

    const supabase = createServerClient(url, publishableKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, options, value }) => response.cookies.set(name, value, options));
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    });

    await supabase.auth.getClaims();
  } catch (error) {
    if (!(error instanceof SupabasePublicConfigError)) {
      throw error;
    }
  }

  return response;
}
