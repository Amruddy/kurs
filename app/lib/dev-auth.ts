import { Role, type Permission } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { getSupabasePublicConfig } from "@/app/lib/supabase/public-env";
import { createSupabaseServerClient } from "@/app/lib/supabase/server";

export type WorkspaceRole = "admin" | "teacher" | "student";

export const workspaceConfig: Record<
  WorkspaceRole,
  {
    label: string;
    homePath: string;
  }
> = {
  admin: {
    label: "Админ",
    homePath: "/admin",
  },
  teacher: {
    label: "Преподаватель",
    homePath: "/teacher",
  },
  student: {
    label: "Ученик",
    homePath: "/student",
  },
};

export const devUsers = {
  admin: {
    label: "Администратор",
    email: "admin@example.test",
    preferredWorkspace: "admin",
  },
  teacher: {
    label: "Преподаватель",
    email: "teacher@example.test",
    preferredWorkspace: "teacher",
  },
  student: {
    label: "Ученик",
    email: "student@example.test",
    preferredWorkspace: "student",
  },
  privateTeacher: {
    label: "Преподаватель-одиночка",
    email: "solo-teacher@example.test",
    preferredWorkspace: "teacher",
  },
} as const satisfies Record<
  string,
  {
    label: string;
    email: string;
    preferredWorkspace: WorkspaceRole;
  }
>;

export type DevUserKey = keyof typeof devUsers;

export type DevSession = {
  userId: string;
  name: string;
  email: string;
  organizationId: string;
  organizationName: string;
  roles: WorkspaceRole[];
  permissions: Permission[];
  activeWorkspace: WorkspaceRole;
  source: "dev" | "supabase";
};

function roleToWorkspace(role: Role): WorkspaceRole | null {
  if (role === Role.admin || role === Role.director) {
    return "admin";
  }

  if (role === Role.teacher) {
    return "teacher";
  }

  if (role === Role.student) {
    return "student";
  }

  return null;
}

function uniqueWorkspaces(roles: Role[]) {
  return Array.from(
    new Set(roles.map(roleToWorkspace).filter((role): role is WorkspaceRole => role !== null)),
  );
}

export function isDevLoginEnabled() {
  return process.env.ENABLE_DEV_LOGIN === "true";
}

function normalizeWorkspace(value?: string): WorkspaceRole | null {
  if (value === "admin" || value === "teacher" || value === "student") {
    return value;
  }

  return null;
}

async function getSelectedWorkspaceCookie() {
  const cookieStore = await cookies();
  return normalizeWorkspace(cookieStore.get("workspace")?.value ?? cookieStore.get("dev_workspace")?.value);
}

async function buildSessionForUser(
  userWhere: { authUserId: string } | { email: string },
  source: DevSession["source"],
): Promise<DevSession | null> {
  const activeWorkspace = await getSelectedWorkspaceCookie();

  const user = await prisma.user.findUnique({
    where: userWhere,
    include: {
      memberships: {
        where: {
          status: "active",
          organization: {
            status: "active",
          },
        },
        include: {
          organization: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const membership = user?.memberships.find((item) => uniqueWorkspaces(item.roles).length > 0);

  if (!user || user.status !== "active" || !membership) {
    return null;
  }

  const roles = uniqueWorkspaces(membership.roles);
  const selectedWorkspace = activeWorkspace && roles.includes(activeWorkspace) ? activeWorkspace : roles[0];

  if (!selectedWorkspace) {
    return null;
  }

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    organizationId: membership.organizationId,
    organizationName: membership.organization.name,
    roles,
    permissions: membership.permissions,
    activeWorkspace: selectedWorkspace,
    source,
  };
}

async function getSupabaseSession(): Promise<DevSession | null> {
  if (!getSupabasePublicConfig()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  let userId: string | null = null;

  try {
    const { data, error } = await supabase.auth.getUser();
    userId = error ? null : (data.user?.id ?? null);
  } catch {
    userId = null;
  }

  if (!userId) {
    return null;
  }

  return buildSessionForUser({ authUserId: userId }, "supabase");
}

async function getFallbackDevSession(): Promise<DevSession | null> {
  if (!isDevLoginEnabled()) {
    return null;
  }

  const cookieStore = await cookies();
  const email = cookieStore.get("dev_user_email")?.value;

  if (!email) {
    return null;
  }

  return buildSessionForUser({ email }, "dev");
}

export async function getCurrentSession(): Promise<DevSession | null> {
  return (await getSupabaseSession()) ?? (await getFallbackDevSession());
}

export async function getDevSession(): Promise<DevSession | null> {
  return getCurrentSession();
}

export async function requireWorkspace(requiredWorkspace: WorkspaceRole) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.roles.includes(requiredWorkspace) || session.activeWorkspace !== requiredWorkspace) {
    redirect(`/forbidden?required=${requiredWorkspace}`);
  }

  return session;
}
