import { cookies } from "next/headers";

export type DevRole = "admin" | "teacher" | "student";

export const devUsers: Record<
  DevRole,
  {
    label: string;
    email: string;
    homePath: string;
  }
> = {
  admin: {
    label: "Администратор",
    email: "admin@example.test",
    homePath: "/admin",
  },
  teacher: {
    label: "Преподаватель",
    email: "teacher@example.test",
    homePath: "/teacher",
  },
  student: {
    label: "Ученик",
    email: "student@example.test",
    homePath: "/student",
  },
};

export async function getDevSession() {
  const cookieStore = await cookies();
  const role = cookieStore.get("dev_role")?.value;

  if (role === "admin" || role === "teacher" || role === "student") {
    return {
      role,
      ...devUsers[role],
    };
  }

  return null;
}

