"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { devUsers, workspaceConfig, type DevUserKey, type WorkspaceRole } from "@/app/lib/dev-auth";

async function loginAs(userKey: DevUserKey) {
  const seedUser = devUsers[userKey];
  const user = await prisma.user.findUnique({
    where: { email: seedUser.email },
    include: {
      memberships: {
        where: { status: "active" },
        include: { organization: true },
      },
    },
  });

  const membership = user?.memberships.find((item) => item.organization.status === "active");

  if (!user || user.status !== "active" || !membership) {
    redirect("/login?error=seed-user-not-found");
  }

  const preferredWorkspace = seedUser.preferredWorkspace;
  const hasPreferredWorkspace =
    membership.roles.includes("director") ||
    (preferredWorkspace === "admin" && membership.roles.includes("admin")) ||
    (preferredWorkspace === "teacher" && membership.roles.includes("teacher")) ||
    (preferredWorkspace === "student" && membership.roles.includes("student"));

  if (!hasPreferredWorkspace) {
    redirect("/login?error=workspace-unavailable");
  }

  const cookieStore = await cookies();
  cookieStore.set("dev_user_email", seedUser.email, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  cookieStore.set("dev_workspace", preferredWorkspace, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  redirect(workspaceConfig[preferredWorkspace].homePath);
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
