"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireWorkspace } from "@/app/lib/dev-auth";

export async function createCoursePayment(courseId: string, formData: FormData) {
  void formData;
  await requireWorkspace("admin");
  revalidatePath(`/admin/courses/${courseId}`);
  redirect(`/admin/courses/${courseId}`);
}

export async function createGroupPayment(groupId: string, formData: FormData) {
  void formData;
  await requireWorkspace("admin");
  revalidatePath(`/admin/groups/${groupId}`);
  redirect(`/admin/groups/${groupId}`);
}

export async function updateStudentPayment(studentId: string, paymentId: string, formData: FormData) {
  void paymentId;
  void formData;
  await requireWorkspace("admin");
  revalidatePath(`/admin/students/${studentId}`);
  redirect(`/admin/students/${studentId}`);
}
