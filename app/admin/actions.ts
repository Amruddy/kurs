"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireWorkspace } from "@/app/lib/dev-auth";

async function requireAdmin() {
  await requireWorkspace("admin");
}

export async function createCourse(formData: FormData) {
  void formData;
  await requireAdmin();
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
  void formData;
  await requireAdmin();
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
  void formData;
  await requireAdmin();
  redirect("/admin/groups");
}

export async function updateGroup(groupId: string, formData: FormData) {
  void formData;
  await requireAdmin();
  revalidatePath("/admin/groups");
  revalidatePath(`/admin/groups/${groupId}`);
}

export async function createGroupScheduleRule(groupId: string, formData: FormData) {
  void formData;
  await requireAdmin();
  revalidatePath(`/admin/groups/${groupId}`);
}

export async function deleteScheduleRule(scheduleRuleId: string, groupId: string) {
  void scheduleRuleId;
  await requireAdmin();
  revalidatePath(`/admin/groups/${groupId}`);
}

export async function generateLessonsForGroup(groupId: string) {
  await requireAdmin();
  revalidatePath(`/admin/groups/${groupId}`);
}

export async function addStudentToGroup(groupId: string, formData: FormData) {
  void formData;
  await requireAdmin();
  revalidatePath(`/admin/groups/${groupId}`);
}

export async function removeStudentFromGroup(groupStudentId: string, groupId: string) {
  void groupStudentId;
  await requireAdmin();
  revalidatePath(`/admin/groups/${groupId}`);
}
