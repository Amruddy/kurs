import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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
    userId: "10000000-0000-4000-8000-000000000001",
    label: "Администратор",
    email: "admin@example.test",
    preferredWorkspace: "admin",
    roles: ["admin", "teacher", "student"],
  },
  teacher: {
    userId: "10000000-0000-4000-8000-000000000002",
    label: "Преподаватель",
    email: "teacher@example.test",
    preferredWorkspace: "teacher",
    roles: ["teacher"],
  },
  student: {
    userId: "10000000-0000-4000-8000-000000000003",
    label: "Ученик",
    email: "student@example.test",
    preferredWorkspace: "student",
    roles: ["student"],
  },
  privateTeacher: {
    userId: "10000000-0000-4000-8000-000000000004",
    label: "Преподаватель-одиночка",
    email: "solo-teacher@example.test",
    preferredWorkspace: "teacher",
    roles: ["teacher"],
  },
} as const satisfies Record<
  string,
  {
    userId: string;
    label: string;
    email: string;
    preferredWorkspace: WorkspaceRole;
    roles: readonly WorkspaceRole[];
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
  permissions: string[];
  activeWorkspace: WorkspaceRole;
};

function isWorkspaceRole(value: string | undefined): value is WorkspaceRole {
  return value === "admin" || value === "teacher" || value === "student";
}

function findDevUserByEmail(email: string) {
  return Object.entries(devUsers).find(([, user]) => user.email === email) ?? null;
}

export async function getDevSession(): Promise<DevSession | null> {
  const cookieStore = await cookies();
  const email = cookieStore.get("dev_user_email")?.value;
  const activeWorkspace = cookieStore.get("dev_workspace")?.value;

  if (!email) {
    return null;
  }

  const entry = findDevUserByEmail(email);

  if (!entry) {
    return null;
  }

  const [, user] = entry;
  const roles = [...user.roles];
  const selectedWorkspace =
    isWorkspaceRole(activeWorkspace) && roles.includes(activeWorkspace)
      ? activeWorkspace
      : user.preferredWorkspace;

  if (!roles.includes(selectedWorkspace)) {
    return null;
  }

  return {
    userId: user.userId,
    name: user.label,
    email: user.email,
    organizationId: "00000000-0000-4000-8000-000000000001",
    organizationName: "Deshar",
    roles,
    permissions: [],
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
