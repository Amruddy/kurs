"use server";

import {
  CourseFormat,
  GroupStatus,
  GroupStudentStatus,
  LessonMarkScale,
  Permission,
  Role,
  StudentStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { prisma } from "@/app/lib/prisma";

function readRequiredText(formData: FormData, name: string) {
  const value = formData.get(name);

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error("Обязательное поле не заполнено.");
  }

  return value.trim();
}

function readOptionalText(formData: FormData, name: string) {
  const value = formData.get(name);

  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  return value.trim();
}

function readCourseFormat(formData: FormData) {
  const value = formData.get("format");

  if (value === CourseFormat.group || value === CourseFormat.individual || value === CourseFormat.both) {
    return value;
  }

  return CourseFormat.group;
}

function readLessonMarkScale(formData: FormData) {
  const value = formData.get("lessonMarkScale");

  if (value === LessonMarkScale.five_point || value === LessonMarkScale.ten_point) {
    return value;
  }

  return null;
}

function readGroupStatus(formData: FormData) {
  const value = formData.get("status");

  if (
    value === GroupStatus.recruiting ||
    value === GroupStatus.active ||
    value === GroupStatus.paused ||
    value === GroupStatus.completed ||
    value === GroupStatus.archived
  ) {
    return value;
  }

  return GroupStatus.recruiting;
}

function readStudentStatus(formData: FormData) {
  const value = formData.get("status");

  if (value === StudentStatus.active || value === StudentStatus.paused || value === StudentStatus.archived) {
    return value;
  }

  return StudentStatus.active;
}

function requirePermission(permissions: Permission[], permission: Permission) {
  if (!permissions.includes(permission) && !permissions.includes(Permission.admin_access)) {
    redirect(`/forbidden?required=${permission}`);
  }
}

async function requireAdminPermission(permission: Permission) {
  const session = await requireWorkspace("admin");
  requirePermission(session.permissions, permission);
  return session;
}

export async function createCourse(formData: FormData) {
  const session = await requireAdminPermission(Permission.courses_write);
  const name = readRequiredText(formData, "name");
  const description = readOptionalText(formData, "description");
  const format = readCourseFormat(formData);
  const lessonMarkScale = readLessonMarkScale(formData);
  const isProgressEnabled = formData.get("isProgressEnabled") === "on";

  const course = await prisma.course.create({
    data: {
      organizationId: session.organizationId,
      name,
      description,
      format,
      lessonMarkScale,
      createdById: session.userId,
      progressSettings: {
        create: {
          name: "Таджвид-прогресс",
          isProgressEnabled,
        },
      },
    },
  });

  revalidatePath("/admin");
  redirect(`/admin/courses/${course.id}`);
}

export async function updateCourse(courseId: string, formData: FormData) {
  const session = await requireAdminPermission(Permission.courses_write);
  const name = readRequiredText(formData, "name");
  const description = readOptionalText(formData, "description");
  const format = readCourseFormat(formData);
  const lessonMarkScale = readLessonMarkScale(formData);
  const isProgressEnabled = formData.get("isProgressEnabled") === "on";

  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      organizationId: session.organizationId,
    },
    select: { id: true },
  });

  if (!course) {
    notFound();
  }

  await prisma.course.update({
    where: { id: course.id },
    data: {
      name,
      description,
      format,
      lessonMarkScale,
      progressSettings: {
        upsert: {
          create: {
            name: "Таджвид-прогресс",
            isProgressEnabled,
          },
          update: {
            isProgressEnabled,
          },
        },
      },
    },
  });

  revalidatePath(`/admin/courses/${course.id}`);
}

export async function archiveCourse(courseId: string) {
  const session = await requireAdminPermission(Permission.courses_write);

  await prisma.course.updateMany({
    where: {
      id: courseId,
      organizationId: session.organizationId,
      status: "active",
    },
    data: {
      status: "archived",
      archivedAt: new Date(),
    },
  });

  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function createTeacher(formData: FormData) {
  const session = await requireAdminPermission(Permission.students_write);
  const name = readRequiredText(formData, "name");
  const email = readRequiredText(formData, "email").toLowerCase();
  const phone = readOptionalText(formData, "phone");

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { email },
      update: {
        name,
        phone,
        status: "active",
      },
      create: {
        name,
        email,
        phone,
        status: "active",
      },
    });

    const membership = await tx.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: session.organizationId,
          userId: user.id,
        },
      },
    });

    const roles = Array.from(new Set([...(membership?.roles ?? []), Role.teacher]));

    await tx.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: session.organizationId,
          userId: user.id,
        },
      },
      update: {
        roles: { set: roles },
        status: "active",
      },
      create: {
        organizationId: session.organizationId,
        userId: user.id,
        roles,
        permissions: [],
        status: "active",
      },
    });
  });

  revalidatePath("/admin/teachers");
  redirect("/admin/teachers");
}

export async function createStudent(formData: FormData) {
  const session = await requireAdminPermission(Permission.students_write);
  const name = readRequiredText(formData, "name");
  const phone = readOptionalText(formData, "phone");
  const email = readOptionalText(formData, "email");
  const status = readStudentStatus(formData);

  const student = await prisma.student.create({
    data: {
      organizationId: session.organizationId,
      name,
      phone,
      email,
      status,
    },
  });

  revalidatePath("/admin/students");
  redirect(`/admin/students/${student.id}`);
}

export async function updateStudent(studentId: string, formData: FormData) {
  const session = await requireAdminPermission(Permission.students_write);
  const name = readRequiredText(formData, "name");
  const phone = readOptionalText(formData, "phone");
  const email = readOptionalText(formData, "email");
  const status = readStudentStatus(formData);

  await prisma.student.updateMany({
    where: {
      id: studentId,
      organizationId: session.organizationId,
    },
    data: {
      name,
      phone,
      email,
      status,
      archivedAt: status === StudentStatus.archived ? new Date() : null,
    },
  });

  revalidatePath("/admin/students");
  revalidatePath(`/admin/students/${studentId}`);
}

export async function createGroup(formData: FormData) {
  const session = await requireAdminPermission(Permission.groups_write);
  const name = readRequiredText(formData, "name");
  const courseId = readRequiredText(formData, "courseId");
  const teacherId = readOptionalText(formData, "teacherId");
  const status = readGroupStatus(formData);

  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      organizationId: session.organizationId,
      status: "active",
    },
    select: { id: true },
  });

  if (!course) {
    redirect("/not-found");
  }

  if (teacherId) {
    const teacher = await prisma.organizationMember.findFirst({
      where: {
        organizationId: session.organizationId,
        userId: teacherId,
        status: "active",
        roles: { has: Role.teacher },
      },
      select: { id: true },
    });

    if (!teacher) {
      notFound();
    }
  }

  const group = await prisma.group.create({
    data: {
      organizationId: session.organizationId,
      courseId: course.id,
      teacherId,
      name,
      status,
    },
  });

  revalidatePath("/admin/groups");
  redirect(`/admin/groups/${group.id}`);
}

export async function updateGroup(groupId: string, formData: FormData) {
  const session = await requireAdminPermission(Permission.groups_write);
  const name = readRequiredText(formData, "name");
  const teacherId = readOptionalText(formData, "teacherId");
  const status = readGroupStatus(formData);

  if (teacherId) {
    const teacher = await prisma.organizationMember.findFirst({
      where: {
        organizationId: session.organizationId,
        userId: teacherId,
        status: "active",
        roles: { has: Role.teacher },
      },
      select: { id: true },
    });

    if (!teacher) {
      redirect("/not-found");
    }
  }

  await prisma.group.updateMany({
    where: {
      id: groupId,
      organizationId: session.organizationId,
    },
    data: {
      name,
      teacherId,
      status,
      archivedAt: status === GroupStatus.archived ? new Date() : null,
    },
  });

  revalidatePath("/admin/groups");
  revalidatePath(`/admin/groups/${groupId}`);
}

export async function addStudentToGroup(groupId: string, formData: FormData) {
  const session = await requireAdminPermission(Permission.groups_write);
  const studentId = readRequiredText(formData, "studentId");

  const group = await prisma.group.findFirst({
    where: {
      id: groupId,
      organizationId: session.organizationId,
      status: { not: "archived" },
    },
    select: { id: true },
  });

  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      organizationId: session.organizationId,
      status: { not: "archived" },
    },
    select: { id: true },
  });

  if (!group || !student) {
    notFound();
  }

  await prisma.groupStudent.upsert({
    where: {
      groupId_studentId: {
        groupId: group.id,
        studentId: student.id,
      },
    },
    update: {
      status: GroupStudentStatus.active,
      leftAt: null,
    },
    create: {
      groupId: group.id,
      studentId: student.id,
      status: GroupStudentStatus.active,
    },
  });

  revalidatePath(`/admin/groups/${group.id}`);
}

export async function removeStudentFromGroup(groupStudentId: string, groupId: string) {
  const session = await requireAdminPermission(Permission.groups_write);

  const link = await prisma.groupStudent.findFirst({
    where: {
      id: groupStudentId,
      groupId,
      group: {
        organizationId: session.organizationId,
      },
    },
    select: { id: true },
  });

  if (!link) {
    notFound();
  }

  await prisma.groupStudent.update({
    where: { id: link.id },
    data: {
      status: GroupStudentStatus.removed,
      leftAt: new Date(),
    },
  });

  revalidatePath(`/admin/groups/${groupId}`);
}
