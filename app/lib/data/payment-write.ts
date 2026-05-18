import "server-only";

import { createSupabaseAdminClient } from "@/app/lib/supabase/server";

export type PaymentPeriodType = "course" | "lesson" | "manual" | "month";
export type PaymentStatus = "exempt" | "overdue" | "paid" | "pending";

export type CreateAdminPaymentInput = {
  amount: number;
  comment: string | null;
  courseId: string | null;
  createdBy: string;
  currency: string;
  dueAt: string | null;
  groupId: string | null;
  internalComment: string | null;
  organizationId: string;
  periodEnd: string | null;
  periodStart: string | null;
  periodType: PaymentPeriodType;
  status: PaymentStatus;
  studentId: string;
};

export type UpdateAdminPaymentStatusInput = {
  changedBy: string;
  comment: string | null;
  organizationId: string;
  paymentId: string;
  status: PaymentStatus;
};

type CourseRow = {
  id: string;
};

type GroupRow = {
  course_id: string;
  id: string;
};

type PaymentStatusRow = {
  id: string;
  status: string;
  student_id: string;
};

type StudentGroupRow = {
  id: string;
  status: string;
};

function assertWriteSuccess(error: { message: string } | null, context: string) {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
}

function assertDateString(value: string | null, label: string) {
  if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${label}: неверная дата.`);
  }
}

function assertPaymentStatus(value: string): asserts value is PaymentStatus {
  if (value !== "exempt" && value !== "overdue" && value !== "paid" && value !== "pending") {
    throw new Error("Статус оплаты: неверное значение.");
  }
}

function assertPaymentPeriodType(value: string): asserts value is PaymentPeriodType {
  if (value !== "course" && value !== "lesson" && value !== "manual" && value !== "month") {
    throw new Error("Период оплаты: неверное значение.");
  }
}

export function normalizePaymentStatus(value: string) {
  assertPaymentStatus(value);
  return value;
}

export function normalizePaymentPeriodType(value: string) {
  assertPaymentPeriodType(value);
  return value;
}

function assertPaymentInput(input: CreateAdminPaymentInput) {
  if (!Number.isFinite(input.amount) || input.amount < 0) {
    throw new Error("Сумма оплаты: укажите неотрицательное число.");
  }

  if (!/^[A-Z]{3}$/.test(input.currency)) {
    throw new Error("Валюта оплаты: используйте трехбуквенный код, например RUB.");
  }

  assertDateString(input.periodStart, "Начало периода");
  assertDateString(input.periodEnd, "Конец периода");
  assertDateString(input.dueAt, "Срок оплаты");

  if (input.periodStart && input.periodEnd && input.periodStart > input.periodEnd) {
    throw new Error("Период оплаты: дата начала не может быть позже даты окончания.");
  }

  if (input.status !== "exempt" && input.periodType !== "manual" && !input.dueAt) {
    throw new Error("Срок оплаты: для этой оплаты нужно указать дату.");
  }
}

async function resolvePaymentContext(client: ReturnType<typeof createSupabaseAdminClient>, input: CreateAdminPaymentInput) {
  const studentResult = await client
    .from("students")
    .select("id")
    .eq("organization_id", input.organizationId)
    .eq("id", input.studentId)
    .maybeSingle();

  if (studentResult.error) {
    throw new Error(`Ученик: ${studentResult.error.message}`);
  }

  if (!studentResult.data) {
    throw new Error("Ученик: запись не найдена в текущей организации.");
  }

  let courseId = input.courseId;
  let groupId = input.groupId;

  if (groupId) {
    const groupResult = await client
      .from("groups")
      .select("id,course_id")
      .eq("organization_id", input.organizationId)
      .eq("id", groupId)
      .maybeSingle();

    if (groupResult.error) {
      throw new Error(`Группа: ${groupResult.error.message}`);
    }

    const group = groupResult.data as GroupRow | null;

    if (!group) {
      throw new Error("Группа: запись не найдена в текущей организации.");
    }

    if (courseId && courseId !== group.course_id) {
      throw new Error("Учебный контекст: выбранная группа относится к другому курсу.");
    }

    courseId = group.course_id;

    const membershipResult = await client
      .from("group_students")
      .select("id,status")
      .eq("group_id", groupId)
      .eq("student_id", input.studentId)
      .maybeSingle();

    if (membershipResult.error) {
      throw new Error(`Состав группы: ${membershipResult.error.message}`);
    }

    const membership = membershipResult.data as StudentGroupRow | null;

    if (!membership || membership.status !== "active") {
      throw new Error("Состав группы: ученик не состоит в выбранной группе.");
    }
  }

  if (!courseId) {
    throw new Error("Курс: выберите курс или группу для оплаты.");
  }

  const courseResult = await client
    .from("courses")
    .select("id")
    .eq("organization_id", input.organizationId)
    .eq("id", courseId)
    .maybeSingle();

  if (courseResult.error) {
    throw new Error(`Курс: ${courseResult.error.message}`);
  }

  const course = courseResult.data as CourseRow | null;

  if (!course) {
    throw new Error("Курс: запись не найдена в текущей организации.");
  }

  return { courseId, groupId };
}

export async function createAdminPayment(input: CreateAdminPaymentInput) {
  assertPaymentInput(input);

  const client = createSupabaseAdminClient();
  const context = await resolvePaymentContext(client, input);
  const result = await client
    .from("payments")
    .insert({
      amount: input.amount,
      comment: input.comment,
      course_id: context.courseId,
      created_by: input.createdBy,
      currency: input.currency,
      due_at: input.dueAt,
      group_id: context.groupId,
      internal_comment: input.internalComment,
      organization_id: input.organizationId,
      period_end: input.periodEnd,
      period_start: input.periodStart,
      period_type: input.periodType,
      status: input.status,
      student_id: input.studentId,
      updated_by: input.createdBy,
    })
    .select("id")
    .single();

  assertWriteSuccess(result.error, "Создание оплаты");

  const paymentId = result.data?.id;

  if (!paymentId) {
    throw new Error("Создание оплаты: Supabase не вернул id записи.");
  }

  const historyResult = await client.from("payment_history").insert({
    changed_by: input.createdBy,
    comment: "Создание оплаты",
    field: "created",
    new_value: input.status,
    old_value: null,
    payment_id: paymentId,
  });

  assertWriteSuccess(historyResult.error, "История оплаты");

  return { paymentId };
}

export async function updateAdminPaymentStatus(input: UpdateAdminPaymentStatusInput) {
  const client = createSupabaseAdminClient();
  const currentResult = await client
    .from("payments")
    .select("id,student_id,status")
    .eq("organization_id", input.organizationId)
    .eq("id", input.paymentId)
    .maybeSingle();

  if (currentResult.error) {
    throw new Error(`Оплата: ${currentResult.error.message}`);
  }

  const current = currentResult.data as PaymentStatusRow | null;

  if (!current) {
    throw new Error("Оплата: запись не найдена в текущей организации.");
  }

  if (current.status === input.status) {
    return { paymentId: current.id, studentId: current.student_id };
  }

  const updateResult = await client
    .from("payments")
    .update({
      status: input.status,
      updated_at: new Date().toISOString(),
      updated_by: input.changedBy,
    })
    .eq("organization_id", input.organizationId)
    .eq("id", input.paymentId);

  assertWriteSuccess(updateResult.error, "Обновление статуса оплаты");

  const historyResult = await client.from("payment_history").insert({
    changed_by: input.changedBy,
    comment: input.comment,
    field: "status",
    new_value: input.status,
    old_value: current.status,
    payment_id: current.id,
  });

  assertWriteSuccess(historyResult.error, "История оплаты");

  return { paymentId: current.id, studentId: current.student_id };
}
