"use server";

import { cookies } from "next/headers";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SupabasePublicConfigError } from "@/app/lib/supabase/env";
import { createSupabaseServerClient } from "@/app/lib/supabase/server";
import {
  activeWorkspaceCookieName,
  clearLocalAuthCookies,
  devUserCookieName,
  devUsers,
  getAppSession,
  hasWorkspaceAccess,
  isDevAuthEnabled,
  legacyDevWorkspaceCookieName,
  resolveSessionByEmail,
  setActiveWorkspaceCookie,
  workspaceConfig,
  type DevUserKey,
  type WorkspaceRole,
} from "@/app/lib/dev-auth";

function loginRedirect(params: Record<string, string>): never {
  const searchParams = new URLSearchParams(params);
  redirect(`/login?${searchParams.toString()}`);
}

function requiredString(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

async function loginAs(userKey: DevUserKey) {
  if (!isDevAuthEnabled()) {
    redirect("/login?error=dev_auth_disabled");
  }

  const seedUser = devUsers[userKey];
  const cookieStore = await cookies();

  cookieStore.set(devUserCookieName, seedUser.email, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  cookieStore.set(legacyDevWorkspaceCookieName, seedUser.preferredWorkspace, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  cookieStore.set(activeWorkspaceCookieName, seedUser.preferredWorkspace, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  redirect(workspaceConfig[seedUser.preferredWorkspace].homePath);
}

export async function loginAsAdmin() {
  await loginAs("admin");
}

export async function loginAsTeacher() {
  await loginAs("teacher");
}

export async function loginAsStudent() {
  await loginAs("student");
}

export async function loginAsPrivateTeacher() {
  await loginAs("privateTeacher");
}

export async function loginWithPassword(formData: FormData) {
  const email = requiredString(formData, "email").toLowerCase();
  const password = requiredString(formData, "password");

  if (!email || !password) {
    loginRedirect({ error: "missing_credentials" });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await supabase.auth.signInWithPassword({ email, password });

    if (result.error || !result.data.user?.email) {
      loginRedirect({ error: "invalid_credentials" });
    }

    const session = await resolveSessionByEmail(result.data.user.email);

    if (!session) {
      await supabase.auth.signOut();
      loginRedirect({ error: "profile_not_found" });
    }

    await setActiveWorkspaceCookie(session.activeWorkspace);
    redirect(workspaceConfig[session.activeWorkspace].homePath);
  } catch (error) {
    if (error instanceof SupabasePublicConfigError) {
      loginRedirect({ error: "supabase_not_configured" });
    }

    throw error;
  }
}

export async function requestPasswordReset(formData: FormData) {
  const email = requiredString(formData, "resetEmail").toLowerCase();

  if (!email) {
    loginRedirect({ error: "missing_reset_email" });
  }

  try {
    const headersList = await headers();
    const origin = headersList.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
    });

    if (error) {
      loginRedirect({ error: "reset_failed" });
    }

    loginRedirect({ message: "password_reset_sent" });
  } catch (error) {
    if (error instanceof SupabasePublicConfigError) {
      loginRedirect({ error: "supabase_not_configured" });
    }

    throw error;
  }
}

export async function logout() {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch (error) {
    if (!(error instanceof SupabasePublicConfigError)) {
      throw error;
    }
  }

  await clearLocalAuthCookies();
  redirect("/login");
}

export async function switchWorkspace(workspace: WorkspaceRole) {
  const session = await getAppSession();

  if (!session || !hasWorkspaceAccess(session, workspace)) {
    redirect(`/forbidden?required=${workspace}`);
  }

  await setActiveWorkspaceCookie(workspace);

  redirect(workspaceConfig[workspace].homePath);
}
