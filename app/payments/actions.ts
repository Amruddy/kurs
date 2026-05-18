"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createAdminPayment,
  normalizePaymentPeriodType,
  normalizePaymentStatus,
  updateAdminPaymentStatus,
} from "@/app/lib/data/payment-write";
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

function amountValue(formData: FormData) {
  const raw = requiredString(formData, "amount", "Сумма оплаты").replace(",", ".");
  const amount = Number.parseFloat(raw);

  if (!Number.isFinite(amount)) {
    throw new Error("Сумма оплаты: укажите число.");
  }

  return amount;
}

function paymentInput(
  session: Awaited<ReturnType<typeof requireAdmin>>,
  formData: FormData,
  overrides: { courseId?: string | null; groupId?: string | null } = {},
) {
  const status = normalizePaymentStatus(optionalString(formData, "status") ?? "pending");
  const periodType = normalizePaymentPeriodType(optionalString(formData, "periodType") ?? "month");

  return {
    amount: amountValue(formData),
    comment: optionalString(formData, "comment"),
    courseId: overrides.courseId ?? optionalString(formData, "courseId"),
    createdBy: session.userId,
    currency: (optionalString(formData, "currency") ?? "RUB").toUpperCase(),
    dueAt: optionalString(formData, "dueAt"),
    groupId: overrides.groupId ?? optionalString(formData, "groupId"),
    internalComment: optionalString(formData, "internalComment"),
    organizationId: session.organizationId,
    periodEnd: optionalString(formData, "periodEnd"),
    periodStart: optionalString(formData, "periodStart"),
    periodType,
    status,
    studentId: requiredString(formData, "studentId", "Ученик"),
  };
}

function revalidatePaymentPages(studentId?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/students");
  revalidatePath("/teacher");
  revalidatePath("/teacher/payments");
  revalidatePath("/student");
  revalidatePath("/student/payments");

  if (studentId) {
    revalidatePath(`/admin/students/${studentId}`);
    revalidatePath(`/teacher/students/${studentId}`);
  }
}

export async function createPayment(formData: FormData) {
  const session = await requireAdmin();
  const input = paymentInput(session, formData);

  await createAdminPayment(input);
  revalidatePaymentPages(input.studentId);
  redirect("/admin/payments");
}

export async function createCoursePayment(courseId: string, formData: FormData) {
  const session = await requireAdmin();
  const input = paymentInput(session, formData, { courseId });

  await createAdminPayment(input);
  revalidatePaymentPages(input.studentId);
  revalidatePath(`/admin/courses/${courseId}`);
  redirect(`/admin/courses/${courseId}`);
}

export async function createGroupPayment(groupId: string, formData: FormData) {
  const session = await requireAdmin();
  const input = paymentInput(session, formData, { groupId });

  await createAdminPayment(input);
  revalidatePaymentPages(input.studentId);
  revalidatePath(`/admin/groups/${groupId}`);
  redirect(`/admin/groups/${groupId}`);
}

export async function updatePaymentStatus(paymentId: string, formData: FormData) {
  const session = await requireAdmin();
  const result = await updateAdminPaymentStatus({
    changedBy: session.userId,
    comment: optionalString(formData, "historyComment"),
    organizationId: session.organizationId,
    paymentId,
    status: normalizePaymentStatus(requiredString(formData, "status", "Статус оплаты")),
  });

  revalidatePaymentPages(result.studentId);
  redirect("/admin/payments");
}

export async function updateStudentPayment(studentId: string, paymentId: string, formData: FormData) {
  const session = await requireAdmin();
  await updateAdminPaymentStatus({
    changedBy: session.userId,
    comment: optionalString(formData, "historyComment"),
    organizationId: session.organizationId,
    paymentId,
    status: normalizePaymentStatus(requiredString(formData, "status", "Статус оплаты")),
  });

  revalidatePaymentPages(studentId);
  revalidatePath(`/admin/students/${studentId}`);
  redirect(`/admin/students/${studentId}`);
}
