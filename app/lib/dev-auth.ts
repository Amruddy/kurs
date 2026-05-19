import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type WorkspaceRole = "admin" | "teacher" | "student";

export type Permission =
  | "admin:access"
  | "courses:write"
  | "groups:write"
  | "journal:write:any"
  | "materials:write"
  | "payments:write"
  | "students:write";

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

const adminPermissions = [
  "admin:access",
  "courses:write",
  "groups:write",
  "students:write",
  "payments:write",
  "materials:write",
] as const satisfies readonly Permission[];

export const devUsers = {
  admin: {
    userId: "10000000-0000-4000-8000-000000000001",
    label: "Администратор",
    email: "admin@example.test",
    preferredWorkspace: "admin",
    roles: ["admin", "teacher", "student"],
    permissions: adminPermissions,
  },
  teacher: {
    userId: "10000000-0000-4000-8000-000000000002",
    label: "Преподаватель",
    email: "teacher@example.test",
    preferredWorkspace: "teacher",
    roles: ["teacher"],
    permissions: ["journal:write:any", "materials:write"],
  },
  student: {
    userId: "10000000-0000-4000-8000-000000000003",
    label: "Ученик",
    email: "student@example.test",
    preferredWorkspace: "student",
    roles: ["student"],
    permissions: [],
  },
  privateTeacher: {
    userId: "10000000-0000-4000-8000-000000000004",
    label: "Преподаватель-одиночка",
    email: "solo-teacher@example.test",
    preferredWorkspace: "teacher",
    roles: ["teacher", "admin"],
    permissions: [...adminPermissions, "journal:write:any"],
  },
} as const satisfies Record<
  string,
  {
    userId: string;
    label: string;
    email: string;
    preferredWorkspace: WorkspaceRole;
    roles: readonly WorkspaceRole[];
    permissions: readonly Permission[];
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

type WorkspaceAccessSubject = {
  roles: readonly WorkspaceRole[];
  permissions: readonly Permission[];
};

function isWorkspaceRole(value: string | undefined): value is WorkspaceRole {
  return value === "admin" || value === "teacher" || value === "student";
}

function findDevUserByEmail(email: string) {
  return Object.entries(devUsers).find(([, user]) => user.email === email) ?? null;
}

export function hasWorkspaceAccess(subject: WorkspaceAccessSubject, workspace: WorkspaceRole) {
  if (workspace === "admin") {
    return subject.roles.includes("admin") || subject.permissions.includes("admin:access");
  }

  return subject.roles.includes(workspace);
}

export function hasPermission(subject: { permissions: readonly Permission[] }, permission: Permission) {
  return subject.permissions.includes(permission);
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
  const permissions = [...user.permissions];
  const selectedWorkspace =
    isWorkspaceRole(activeWorkspace) && hasWorkspaceAccess({ permissions, roles }, activeWorkspace)
      ? activeWorkspace
      : user.preferredWorkspace;

  if (!hasWorkspaceAccess({ permissions, roles }, selectedWorkspace)) {
    return null;
  }

  return {
    userId: user.userId,
    name: user.label,
    email: user.email,
    organizationId: "00000000-0000-4000-8000-000000000001",
    organizationName: "Deshar",
    roles,
    permissions,
    activeWorkspace: selectedWorkspace,
  };
}

export async function requireWorkspace(requiredWorkspace: WorkspaceRole) {
  const session = await getDevSession();

  if (!session) {
    redirect("/login");
  }

  if (!hasWorkspaceAccess(session, requiredWorkspace) || session.activeWorkspace !== requiredWorkspace) {
    redirect(`/forbidden?required=${requiredWorkspace}`);
  }

  return session;
}

export async function requireWorkspacePermission(requiredWorkspace: WorkspaceRole, permission: Permission) {
  const session = await requireWorkspace(requiredWorkspace);

  if (!hasPermission(session, permission)) {
    redirect(`/forbidden?required=${permission}`);
  }

  return session;
}
