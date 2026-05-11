"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { devUsers, type DevRole } from "@/app/lib/dev-auth";

async function loginAs(role: DevRole) {
  const seedUser = devUsers[role];
  const user = await prisma.user.findUnique({
    where: { email: seedUser.email },
    select: { id: true },
  });

  if (!user) {
    redirect("/login?error=seed-user-not-found");
  }

  const cookieStore = await cookies();
  cookieStore.set("dev_role", role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  cookieStore.set("dev_user_email", seedUser.email, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  redirect(seedUser.homePath);
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

