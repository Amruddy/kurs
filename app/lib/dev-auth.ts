import { Role, type Permission } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";

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

export async function getDevSession(): Promise<DevSession | null> {
  const cookieStore = await cookies();
  const email = cookieStore.get("dev_user_email")?.value;
  const activeWorkspace = cookieStore.get("dev_workspace")?.value;

  if (!email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      memberships: {
        where: { status: "active" },
        include: {
          organization: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const membership = user?.memberships.find((item) => item.organization.status === "active");

  if (!user || user.status !== "active" || !membership) {
    return null;
  }

  const roles = uniqueWorkspaces(membership.roles);
  const selectedWorkspace =
    activeWorkspace === "admin" || activeWorkspace === "teacher" || activeWorkspace === "student"
      ? activeWorkspace
      : roles[0];

  if (!selectedWorkspace || !roles.includes(selectedWorkspace)) {
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
  };
}

export async function requireWorkspace(requiredWorkspace: WorkspaceRole) {
  const session = await getDevSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.roles.includes(requiredWorkspace) || session.activeWorkspace !== requiredWorkspace) {
    redirect(`/forbidden?required=${requiredWorkspace}`);
  }

  return session;
}

