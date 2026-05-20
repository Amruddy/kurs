"use server";

import { redirect } from "next/navigation";
import { getAppSession, workspaceConfig } from "@/app/lib/dev-auth";
import { SupabasePublicConfigError } from "@/app/lib/supabase/env";
import { createSupabaseServerClient } from "@/app/lib/supabase/server";

function resetRedirect(params: Record<string, string>): never {
  const searchParams = new URLSearchParams(params);
  redirect(`/auth/reset-password?${searchParams.toString()}`);
}

function requiredString(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

export async function updatePassword(formData: FormData) {
  const password = requiredString(formData, "password");
  const passwordConfirmation = requiredString(formData, "passwordConfirmation");

  if (!password || password.length < 8) {
    resetRedirect({ error: "password_too_short" });
  }

  if (password !== passwordConfirmation) {
    resetRedirect({ error: "password_mismatch" });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      resetRedirect({ error: "password_update_failed" });
    }

    const session = await getAppSession();

    if (session) {
      redirect(workspaceConfig[session.activeWorkspace].homePath);
    }

    redirect("/login?message=password_updated");
  } catch (error) {
    if (error instanceof SupabasePublicConfigError) {
      resetRedirect({ error: "supabase_not_configured" });
    }

    throw error;
  }
}
