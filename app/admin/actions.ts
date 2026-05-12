"use server";

import {
  CourseFormat,
  GroupStatus,
  GroupStudentStatus,
  LessonStatus,
  LessonMarkScale,
  Permission,
  Role,
  ScheduleRuleStatus,
  ScheduleTargetType,
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

function readWeekday(formData: FormData) {
  const value = Number(formData.get("weekday"));

  if (Number.isInteger(value) && value >= 0 && value <= 6) {
    return value;
  }

  throw new Error("Неверный день недели.");
}

function readDate(formData: FormData, name: string) {
  const value = readRequiredText(formData, name);
  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Неверная дата.");
  }

  return date;
}

function readOptionalDate(formData: FormData, name: string) {
  const value = readOptionalText(formData, name);

  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Неверная дата.");
  }

  return date;
}

function assertTime(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    throw new Error("Неверное время.");
  }

  const [hours, minutes] = value.split(":").map(Number);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error("Неверное время.");
  }
}

function moscowDateTime(day: Date, time: string) {
  const datePart = day.toISOString().slice(0, 10);
  return new Date(`${datePart}T${time}:00+03:00`);
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function startOfUtcMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function startOfNextUtcMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
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

export async function createStudentInGroup(groupId: string, formData: FormData) {
  const session = await requireAdminPermission(Permission.students_write);
  const name = readRequiredText(formData, "name");
  const phone = readOptionalText(formData, "phone");
  const email = readOptionalText(formData, "email");

  const group = await prisma.group.findFirst({
    where: {
      id: groupId,
      organizationId: session.organizationId,
      status: { not: "archived" },
    },
    select: { id: true },
  });

  if (!group) {
    notFound();
  }

  await prisma.$transaction(async (tx) => {
    const student = await tx.student.create({
      data: {
        organizationId: session.organizationId,
        name,
        phone,
        email,
        status: StudentStatus.active,
      },
    });

    await tx.groupStudent.create({
      data: {
        groupId: group.id,
        studentId: student.id,
        status: GroupStudentStatus.active,
      },
    });
  });

  revalidatePath("/admin/students");
  revalidatePath(`/admin/groups/${group.id}`);
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
    notFound();
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
      notFound();
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

export async function createGroupScheduleRule(groupId: string, formData: FormData) {
  const session = await requireAdminPermission(Permission.groups_write);
  const weekday = readWeekday(formData);
  const startTime = readRequiredText(formData, "startTime");
  const endTime = readOptionalText(formData, "endTime");
  const startsOn = readDate(formData, "startsOn");
  const endsOn = readOptionalDate(formData, "endsOn");

  assertTime(startTime);

  if (endTime) {
    assertTime(endTime);

    if (endTime <= startTime) {
      throw new Error("Время окончания должно быть позже начала.");
    }
  }

  if (endsOn && endsOn < startsOn) {
    throw new Error("Дата окончания не может быть раньше даты начала.");
  }

  const group = await prisma.group.findFirst({
    where: {
      id: groupId,
      organizationId: session.organizationId,
      status: { not: "archived" },
    },
    select: { id: true },
  });

  if (!group) {
    notFound();
  }

  await prisma.scheduleRule.create({
    data: {
      organizationId: session.organizationId,
      targetType: ScheduleTargetType.group,
      targetId: group.id,
      weekday,
      startTime,
      endTime,
      startsOn,
      endsOn,
      timezone: "Europe/Moscow",
    },
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/groups/${group.id}`);
}

export async function deleteScheduleRule(scheduleRuleId: string, groupId: string) {
  const session = await requireAdminPermission(Permission.groups_write);
  const rule = await prisma.scheduleRule.findFirst({
    where: {
      id: scheduleRuleId,
      organizationId: session.organizationId,
      targetType: ScheduleTargetType.group,
      targetId: groupId,
    },
    select: { id: true },
  });

  if (!rule) {
    notFound();
  }

  const protectedLesson = await prisma.lesson.findFirst({
    where: {
      organizationId: session.organizationId,
      scheduleRuleId: rule.id,
      lessonStatus: { not: LessonStatus.scheduled },
    },
    select: { id: true },
  });

  if (protectedLesson) {
    throw new Error("Нельзя удалить расписание, по которому уже созданы уроки.");
  }

  await prisma.$transaction([
    prisma.lesson.deleteMany({
      where: {
        organizationId: session.organizationId,
        scheduleRuleId: rule.id,
        lessonStatus: LessonStatus.scheduled,
      },
    }),
    prisma.scheduleRule.delete({
      where: { id: rule.id },
    }),
  ]);

  revalidatePath("/admin");
  revalidatePath("/teacher");
  revalidatePath("/teacher/groups");
  revalidatePath(`/teacher/groups/${groupId}`);
  revalidatePath(`/admin/groups/${groupId}`);
}

export async function generateLessonsForGroup(groupId: string) {
  const session = await requireAdminPermission(Permission.groups_write);
  const group = await prisma.group.findFirst({
    where: {
      id: groupId,
      organizationId: session.organizationId,
      status: { not: "archived" },
    },
    include: {
      course: true,
    },
  });

  if (!group || !group.teacherId) {
    notFound();
  }

  const rules = await prisma.scheduleRule.findMany({
    where: {
      organizationId: session.organizationId,
      targetType: ScheduleTargetType.group,
      targetId: group.id,
      status: ScheduleRuleStatus.active,
    },
  });

  const today = startOfUtcDay(new Date());
  const monthStart = startOfUtcMonth(today);
  const monthEnd = startOfNextUtcMonth(today);

  for (const rule of rules) {
    const startsOn = startOfUtcDay(rule.startsOn);
    const endsOn = rule.endsOn ? startOfUtcDay(rule.endsOn) : monthEnd;
    const firstDay = startsOn > monthStart ? startsOn : monthStart;
    const lastDay = endsOn < monthEnd ? endsOn : monthEnd;

    for (let day = firstDay; day < lastDay; day = addDays(day, 1)) {
      if (day.getUTCDay() !== rule.weekday) {
        continue;
      }

      const startsAt = moscowDateTime(day, rule.startTime);
      const endsAt = rule.endTime ? moscowDateTime(day, rule.endTime) : null;

      await prisma.lesson.upsert({
        where: {
          organizationId_scheduleRuleId_startsAt: {
            organizationId: session.organizationId,
            scheduleRuleId: rule.id,
            startsAt,
          },
        },
        update: {},
        create: {
          organizationId: session.organizationId,
          courseId: group.courseId,
          groupId: group.id,
          teacherId: group.teacherId,
          scheduleRuleId: rule.id,
          scheduledAt: startsAt,
          startsAt,
          endsAt,
        },
      });
    }
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/groups/${group.id}`);
  revalidatePath("/teacher");
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
