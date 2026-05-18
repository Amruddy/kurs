"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  assignAdminStudentToGroup,
  createAdminCourse,
  createAdminGroup,
  createAdminGroupScheduleRule,
  createAdminStudent,
  deleteAdminGroupScheduleRule,
  generateAdminGroupLessons,
  type LessonGenerationHorizon,
  updateAdminGroup,
} from "@/app/lib/data/admin-write";
import { requireWorkspace } from "@/app/lib/dev-auth";

async function requireAdmin() {
  return requireWorkspace("admin");
}

function requiredString(formData: FormData, name: string, label: string) {
  const value = formData.get(name);

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label}: обязательное поле.`);
  }

  return value.trim();
}

function optionalString(formData: FormData, name: string) {
  const value = formData.get(name);

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function requiredIntegers(formData: FormData, name: string, label: string) {
  const values = formData.getAll(name);

  if (values.length === 0) {
    throw new Error(`${label}: выберите хотя бы одно значение.`);
  }

  return values.map((raw) => {
    if (typeof raw !== "string") {
      throw new Error(`${label}: неверное значение.`);
    }

    const value = Number.parseInt(raw, 10);

    if (!Number.isInteger(value)) {
      throw new Error(`${label}: неверное число.`);
    }

    return value;
  });
}

function lessonGenerationHorizon(formData: FormData): LessonGenerationHorizon {
  const value = optionalString(formData, "horizon") ?? "one_month";

  if (value === "one_month" || value === "three_months" || value === "schedule_end") {
    return value;
  }

  throw new Error("Срок создания занятий: неверное значение.");
}

export async function createCourse(formData: FormData) {
  const session = await requireAdmin();

  await createAdminCourse({
    organizationId: session.organizationId,
    createdBy: session.userId,
    name: requiredString(formData, "name", "Название курса"),
    description: optionalString(formData, "description"),
    format: requiredString(formData, "format", "Формат курса"),
    lessonMarkScale: requiredString(formData, "lessonMarkScale", "Шкала оценок"),
  });

  revalidatePath("/admin");
  revalidatePath("/admin/courses");
  redirect("/admin/courses");
}

export async function updateCourse(courseId: string, formData: FormData) {
  void formData;
  await requireAdmin();
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function archiveCourse(courseId: string) {
  await requireAdmin();
  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function createTeacher(formData: FormData) {
  void formData;
  await requireAdmin();
  redirect("/admin/teachers");
}

export async function createStudent(formData: FormData) {
  const session = await requireAdmin();

  await createAdminStudent({
    organizationId: session.organizationId,
    name: requiredString(formData, "name", "Имя ученика"),
    phone: optionalString(formData, "phone"),
    email: optionalString(formData, "email"),
  });

  revalidatePath("/admin");
  revalidatePath("/admin/students");
  redirect("/admin/students");
}

export async function createStudentInGroup(groupId: string, formData: FormData) {
  void formData;
  await requireAdmin();
  revalidatePath(`/admin/groups/${groupId}`);
}

export async function updateStudent(studentId: string, formData: FormData) {
  void formData;
  await requireAdmin();
  revalidatePath("/admin/students");
  revalidatePath(`/admin/students/${studentId}`);
}

export async function createGroup(formData: FormData) {
  const session = await requireAdmin();

  await createAdminGroup({
    organizationId: session.organizationId,
    courseId: requiredString(formData, "courseId", "Курс"),
    teacherId: requiredString(formData, "teacherId", "Преподаватель"),
    name: requiredString(formData, "name", "Название группы"),
    status: requiredString(formData, "status", "Статус группы"),
  });

  revalidatePath("/admin");
  revalidatePath("/admin/groups");
  redirect("/admin/groups");
}

export async function updateGroup(groupId: string, formData: FormData) {
  const session = await requireAdmin();

  await updateAdminGroup({
    organizationId: session.organizationId,
    groupId,
    teacherId: optionalString(formData, "teacherId"),
    name: requiredString(formData, "name", "Название группы"),
    status: requiredString(formData, "status", "Статус группы"),
  });

  revalidatePath("/admin");
  revalidatePath("/admin/groups");
  revalidatePath(`/admin/groups/${groupId}`);
  redirect(`/admin/groups/${groupId}`);
}

export async function createGroupScheduleRule(groupId: string, formData: FormData) {
  const session = await requireAdmin();

  await createAdminGroupScheduleRule({
    organizationId: session.organizationId,
    groupId,
    weekdays: requiredIntegers(formData, "weekdays", "Дни недели"),
    startTime: requiredString(formData, "startTime", "Время начала"),
    endTime: requiredString(formData, "endTime", "Время окончания"),
    startsOn: requiredString(formData, "startsOn", "Дата начала"),
    endsOn: optionalString(formData, "endsOn"),
  });

  revalidatePath("/admin");
  revalidatePath("/admin/groups");
  revalidatePath(`/admin/groups/${groupId}`);
  redirect(`/admin/groups/${groupId}`);
}

export async function deleteScheduleRule(scheduleRuleId: string, groupId: string) {
  const session = await requireAdmin();

  await deleteAdminGroupScheduleRule({
    organizationId: session.organizationId,
    groupId,
    scheduleRuleId,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/groups");
  revalidatePath(`/admin/groups/${groupId}`);
  redirect(`/admin/groups/${groupId}`);
}

export async function generateLessonsForGroup(groupId: string, formData: FormData) {
  const session = await requireAdmin();

  await generateAdminGroupLessons({
    organizationId: session.organizationId,
    groupId,
    horizon: lessonGenerationHorizon(formData),
  });

  revalidatePath("/admin");
  revalidatePath("/admin/groups");
  revalidatePath(`/admin/groups/${groupId}`);
  redirect(`/admin/groups/${groupId}`);
}

export async function addStudentToGroup(groupId: string, formData: FormData) {
  const studentId = requiredString(formData, "studentId", "Ученик");
  await requireAdmin();
  await assignAdminStudentToGroup({ groupId, studentId });
  revalidatePath("/admin");
  revalidatePath("/admin/groups");
  revalidatePath(`/admin/groups/${groupId}`);
  redirect(`/admin/groups/${groupId}`);
}

export async function assignStudentToGroup(formData: FormData) {
  await requireAdmin();

  const groupId = requiredString(formData, "groupId", "Группа");
  const studentId = requiredString(formData, "studentId", "Ученик");

  await assignAdminStudentToGroup({ groupId, studentId });

  revalidatePath("/admin");
  revalidatePath("/admin/groups");
  redirect("/admin/groups");
}

export async function removeStudentFromGroup(groupStudentId: string, groupId: string) {
  void groupStudentId;
  await requireAdmin();
  revalidatePath(`/admin/groups/${groupId}`);
}
