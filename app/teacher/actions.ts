"use server";

import { revalidatePath } from "next/cache";
import { saveTeacherGroupJournal } from "@/app/lib/data/teacher-write";
import { requireWorkspace } from "@/app/lib/dev-auth";

async function requireTeacher() {
  return requireWorkspace("teacher");
}

export async function saveLessonJournal(lessonId: string, formData: FormData) {
  void formData;
  await requireTeacher();
  revalidatePath(`/teacher/lessons/${lessonId}`);
}

export async function saveLessonDetails(lessonId: string, formData: FormData) {
  void formData;
  await requireTeacher();
  revalidatePath(`/teacher/lessons/${lessonId}`);
}

export async function saveGroupJournal(groupId: string, formData: FormData) {
  const session = await requireTeacher();
  await saveTeacherGroupJournal({
    email: session.email,
    formData,
    groupId,
    organizationId: session.organizationId,
  });
  revalidatePath(`/teacher/groups/${groupId}/journal`);
}

export async function createProgressRule(studentId: string, formData: FormData) {
  void formData;
  await requireTeacher();
  revalidatePath(`/teacher/students/${studentId}`);
}

export async function createProgressError(studentId: string, formData: FormData) {
  void formData;
  await requireTeacher();
  revalidatePath(`/teacher/students/${studentId}`);
}

export async function createProgressRecord(studentId: string, lessonId: string | null, formData: FormData) {
  void formData;
  await requireTeacher();
  revalidatePath(`/teacher/students/${studentId}`);

  if (lessonId) {
    revalidatePath(`/teacher/lessons/${lessonId}`);
  }
}

export async function createLessonProgress(lessonId: string, formData: FormData) {
  void formData;
  await requireTeacher();
  revalidatePath(`/teacher/lessons/${lessonId}`);
}

export async function createLessonHomework(lessonId: string, formData: FormData) {
  void formData;
  await requireTeacher();
  revalidatePath(`/teacher/lessons/${lessonId}`);
}

export async function createGroupHomework(groupId: string, formData: FormData) {
  void formData;
  await requireTeacher();
  revalidatePath(`/teacher/groups/${groupId}`);
}

export async function createTeacherHomework(formData: FormData) {
  void formData;
  await requireTeacher();
  revalidatePath("/teacher/homework");
}

export async function createLessonMaterial(lessonId: string, formData: FormData) {
  void formData;
  await requireTeacher();
  revalidatePath(`/teacher/lessons/${lessonId}`);
}

export async function createGroupMaterial(groupId: string, formData: FormData) {
  void formData;
  await requireTeacher();
  revalidatePath(`/teacher/groups/${groupId}`);
}

export async function createTeacherMaterial(formData: FormData) {
  void formData;
  await requireTeacher();
  revalidatePath("/teacher/materials");
}
