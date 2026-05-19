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

export type CreateBulkAdminPaymentsInput = {
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
  targetType: "course" | "group";
};

export type UpdateAdminPaymentStatusInput = {
  changedBy: string;
  comment: string | null;
  organizationId: string;
  paymentId: string;
  status: PaymentStatus;
};

export type UpdateAdminPaymentDetailsInput = {
  amount: number;
  changedBy: string;
  comment: string | null;
  currency: string;
  dueAt: string | null;
  internalComment: string | null;
  organizationId: string;
  paymentId: string;
  periodEnd: string | null;
  periodStart: string | null;
  periodType: PaymentPeriodType;
};

type CourseRow = {
  id: string;
};

type GroupRow = {
  course_id: string;
  id: string;
};

type GroupIdRow = {
  id: string;
};

type PaymentDuplicateRow = {
  student_id: string;
};

type PaymentInsertRow = {
  id: string;
  student_id: string;
};

type PaymentStatusRow = {
  id: string;
  status: string;
  student_id: string;
};

type PaymentDetailsRow = {
  amount: number;
  comment: string | null;
  currency: string;
  due_at: string | null;
  id: string;
  internal_comment: string | null;
  period_end: string | null;
  period_start: string | null;
  period_type: string;
  status: string;
  student_id: string;
};

type StudentGroupRow = {
  id: string;
  status: string;
};

type StudentIdRow = {
  id: string;
};

type StudentRelationRow = {
  student_id: string;
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

type PaymentBaseValidationInput = Pick<
  CreateAdminPaymentInput,
  "amount" | "currency" | "dueAt" | "periodEnd" | "periodStart" | "periodType" | "status"
>;

function assertPaymentBaseInput(input: PaymentBaseValidationInput) {
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

function assertPaymentInput(input: CreateAdminPaymentInput) {
  assertPaymentBaseInput(input);
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

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

async function filterActiveStudentIds(
  client: ReturnType<typeof createSupabaseAdminClient>,
  organizationId: string,
  studentIds: string[],
) {
  const uniqueStudentIds = uniqueStrings(studentIds);

  if (uniqueStudentIds.length === 0) {
    return [];
  }

  const studentsResult = await client
    .from("students")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .in("id", uniqueStudentIds);

  if (studentsResult.error) {
    throw new Error(`Ученики: ${studentsResult.error.message}`);
  }

  return ((studentsResult.data ?? []) as StudentIdRow[]).map((student) => student.id);
}

async function resolveBulkGroupTarget(
  client: ReturnType<typeof createSupabaseAdminClient>,
  input: CreateBulkAdminPaymentsInput,
) {
  if (!input.groupId) {
    throw new Error("Группа: выберите группу для добавления оплаты.");
  }

  const groupResult = await client
    .from("groups")
    .select("id,course_id")
    .eq("organization_id", input.organizationId)
    .eq("id", input.groupId)
    .maybeSingle();

  if (groupResult.error) {
    throw new Error(`Группа: ${groupResult.error.message}`);
  }

  const group = groupResult.data as GroupRow | null;

  if (!group) {
    throw new Error("Группа: запись не найдена в текущей организации.");
  }

  const membersResult = await client
    .from("group_students")
    .select("student_id")
    .eq("group_id", group.id)
    .eq("status", "active");

  if (membersResult.error) {
    throw new Error(`Состав группы: ${membersResult.error.message}`);
  }

  const memberStudentIds = ((membersResult.data ?? []) as StudentRelationRow[]).map((member) => member.student_id);
  const studentIds = await filterActiveStudentIds(client, input.organizationId, memberStudentIds);

  return { courseId: group.course_id, groupId: group.id, studentIds };
}

async function resolveBulkCourseTarget(
  client: ReturnType<typeof createSupabaseAdminClient>,
  input: CreateBulkAdminPaymentsInput,
) {
  if (!input.courseId) {
    throw new Error("Курс: выберите курс для добавления оплаты.");
  }

  const courseResult = await client
    .from("courses")
    .select("id")
    .eq("organization_id", input.organizationId)
    .eq("id", input.courseId)
    .maybeSingle();

  if (courseResult.error) {
    throw new Error(`Курс: ${courseResult.error.message}`);
  }

  const course = courseResult.data as CourseRow | null;

  if (!course) {
    throw new Error("Курс: запись не найдена в текущей организации.");
  }

  const [groupsResult, individualEnrollmentsResult] = await Promise.all([
    client
      .from("groups")
      .select("id")
      .eq("organization_id", input.organizationId)
      .eq("course_id", course.id)
      .in("status", ["active", "recruiting"]),
    client
      .from("individual_enrollments")
      .select("student_id")
      .eq("organization_id", input.organizationId)
      .eq("course_id", course.id)
      .eq("status", "active"),
  ]);

  if (groupsResult.error) {
    throw new Error(`Группы курса: ${groupsResult.error.message}`);
  }

  if (individualEnrollmentsResult.error) {
    throw new Error(`Индивидуальное обучение курса: ${individualEnrollmentsResult.error.message}`);
  }

  const groupIds = ((groupsResult.data ?? []) as GroupIdRow[]).map((group) => group.id);
  const groupMembersResult =
    groupIds.length > 0
      ? await client.from("group_students").select("student_id").in("group_id", groupIds).eq("status", "active")
      : { data: [], error: null };

  if (groupMembersResult.error) {
    throw new Error(`Состав групп курса: ${groupMembersResult.error.message}`);
  }

  const groupStudentIds = ((groupMembersResult.data ?? []) as StudentRelationRow[]).map((member) => member.student_id);
  const individualStudentIds = ((individualEnrollmentsResult.data ?? []) as StudentRelationRow[]).map(
    (enrollment) => enrollment.student_id,
  );
  const studentIds = await filterActiveStudentIds(client, input.organizationId, [
    ...groupStudentIds,
    ...individualStudentIds,
  ]);

  return { courseId: course.id, groupId: null, studentIds };
}

async function resolveBulkPaymentTarget(
  client: ReturnType<typeof createSupabaseAdminClient>,
  input: CreateBulkAdminPaymentsInput,
) {
  if (input.targetType === "group") {
    return resolveBulkGroupTarget(client, input);
  }

  return resolveBulkCourseTarget(client, input);
}

async function findExistingPaymentStudentIds(
  client: ReturnType<typeof createSupabaseAdminClient>,
  input: CreateBulkAdminPaymentsInput,
  context: { courseId: string; groupId: string | null },
  studentIds: string[],
) {
  let query = client
    .from("payments")
    .select("student_id")
    .eq("organization_id", input.organizationId)
    .eq("course_id", context.courseId)
    .eq("period_type", input.periodType)
    .is("individual_enrollment_id", null)
    .in("student_id", studentIds);

  query = context.groupId ? query.eq("group_id", context.groupId) : query.is("group_id", null);
  query = input.periodStart ? query.eq("period_start", input.periodStart) : query.is("period_start", null);
  query = input.periodEnd ? query.eq("period_end", input.periodEnd) : query.is("period_end", null);
  query = input.dueAt ? query.eq("due_at", input.dueAt) : query.is("due_at", null);

  const existingResult = await query;

  if (existingResult.error) {
    throw new Error(`Проверка дублей оплат: ${existingResult.error.message}`);
  }

  return new Set(((existingResult.data ?? []) as PaymentDuplicateRow[]).map((payment) => payment.student_id));
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

export async function createBulkAdminPayments(input: CreateBulkAdminPaymentsInput) {
  assertPaymentBaseInput(input);

  const client = createSupabaseAdminClient();
  const context = await resolveBulkPaymentTarget(client, input);
  const targetStudentIds = uniqueStrings(context.studentIds);

  if (targetStudentIds.length === 0) {
    return { createdCount: 0, paymentIds: [], skippedCount: 0, targetStudentCount: 0 };
  }

  const existingStudentIds = await findExistingPaymentStudentIds(client, input, context, targetStudentIds);
  const studentIdsToCreate = targetStudentIds.filter((studentId) => !existingStudentIds.has(studentId));

  if (studentIdsToCreate.length === 0) {
    return {
      createdCount: 0,
      paymentIds: [],
      skippedCount: targetStudentIds.length,
      targetStudentCount: targetStudentIds.length,
    };
  }

  const insertResult = await client
    .from("payments")
    .insert(
      studentIdsToCreate.map((studentId) => ({
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
        student_id: studentId,
        updated_by: input.createdBy,
      })),
    )
    .select("id,student_id");

  assertWriteSuccess(insertResult.error, "Добавление оплат");

  const createdPayments = (insertResult.data ?? []) as PaymentInsertRow[];

  if (createdPayments.length === 0) {
    throw new Error("Добавление оплат: Supabase не вернул созданные записи.");
  }

  const historyResult = await client.from("payment_history").insert(
    createdPayments.map((payment) => ({
      changed_by: input.createdBy,
      comment: "Добавление оплат",
      field: "created",
      new_value: input.status,
      old_value: null,
      payment_id: payment.id,
    })),
  );

  assertWriteSuccess(historyResult.error, "История добавления оплат");

  return {
    createdCount: createdPayments.length,
    paymentIds: createdPayments.map((payment) => payment.id),
    skippedCount: targetStudentIds.length - createdPayments.length,
    targetStudentCount: targetStudentIds.length,
  };
}

function normalizedNullable(value: string | null) {
  return value ?? "";
}

function paymentDetailChanges(current: PaymentDetailsRow, input: UpdateAdminPaymentDetailsInput) {
  const nextAmount = String(input.amount);
  const currentAmount = String(Number(current.amount));

  return [
    {
      field: "amount",
      oldValue: currentAmount,
      newValue: nextAmount,
      changed: currentAmount !== nextAmount,
    },
    {
      field: "currency",
      oldValue: current.currency,
      newValue: input.currency,
      changed: current.currency !== input.currency,
    },
    {
      field: "period_type",
      oldValue: current.period_type,
      newValue: input.periodType,
      changed: current.period_type !== input.periodType,
    },
    {
      field: "period_start",
      oldValue: normalizedNullable(current.period_start),
      newValue: normalizedNullable(input.periodStart),
      changed: normalizedNullable(current.period_start) !== normalizedNullable(input.periodStart),
    },
    {
      field: "period_end",
      oldValue: normalizedNullable(current.period_end),
      newValue: normalizedNullable(input.periodEnd),
      changed: normalizedNullable(current.period_end) !== normalizedNullable(input.periodEnd),
    },
    {
      field: "due_at",
      oldValue: normalizedNullable(current.due_at),
      newValue: normalizedNullable(input.dueAt),
      changed: normalizedNullable(current.due_at) !== normalizedNullable(input.dueAt),
    },
    {
      field: "comment",
      oldValue: normalizedNullable(current.comment),
      newValue: normalizedNullable(input.comment),
      changed: normalizedNullable(current.comment) !== normalizedNullable(input.comment),
    },
    {
      field: "internal_comment",
      oldValue: normalizedNullable(current.internal_comment),
      newValue: normalizedNullable(input.internalComment),
      changed: normalizedNullable(current.internal_comment) !== normalizedNullable(input.internalComment),
    },
  ].filter((change) => change.changed);
}

export async function updateAdminPaymentDetails(input: UpdateAdminPaymentDetailsInput) {
  const client = createSupabaseAdminClient();
  const currentResult = await client
    .from("payments")
    .select("id,student_id,amount,currency,period_type,period_start,period_end,due_at,status,comment,internal_comment")
    .eq("organization_id", input.organizationId)
    .eq("id", input.paymentId)
    .maybeSingle();

  if (currentResult.error) {
    throw new Error(`Оплата: ${currentResult.error.message}`);
  }

  const current = currentResult.data as PaymentDetailsRow | null;

  if (!current) {
    throw new Error("Оплата: запись не найдена в текущей организации.");
  }

  assertPaymentStatus(current.status);
  assertPaymentBaseInput({ ...input, status: current.status });

  const changes = paymentDetailChanges(current, input);

  if (changes.length === 0) {
    return { paymentId: current.id, studentId: current.student_id };
  }

  const updateResult = await client
    .from("payments")
    .update({
      amount: input.amount,
      comment: input.comment,
      currency: input.currency,
      due_at: input.dueAt,
      internal_comment: input.internalComment,
      period_end: input.periodEnd,
      period_start: input.periodStart,
      period_type: input.periodType,
      updated_at: new Date().toISOString(),
      updated_by: input.changedBy,
    })
    .eq("organization_id", input.organizationId)
    .eq("id", input.paymentId);

  assertWriteSuccess(updateResult.error, "Обновление оплаты");

  const historyResult = await client.from("payment_history").insert(
    changes.map((change) => ({
      changed_by: input.changedBy,
      comment: "Изменение оплаты",
      field: change.field,
      new_value: change.newValue,
      old_value: change.oldValue,
      payment_id: current.id,
    })),
  );

  assertWriteSuccess(historyResult.error, "История оплаты");

  return { paymentId: current.id, studentId: current.student_id };
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
