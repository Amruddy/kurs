"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { devUsers, workspaceConfig, type DevUserKey, type WorkspaceRole } from "@/app/lib/dev-auth";

async function loginAs(userKey: DevUserKey) {
  const seedUser = devUsers[userKey];
  const cookieStore = await cookies();

  cookieStore.set("dev_user_email", seedUser.email, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  cookieStore.set("dev_workspace", seedUser.preferredWorkspace, {
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

export async function switchWorkspace(workspace: WorkspaceRole) {
  const cookieStore = await cookies();
  cookieStore.set("dev_workspace", workspace, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  redirect(workspaceConfig[workspace].homePath);
}
