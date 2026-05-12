"use server";

import { PaymentPeriodType, PaymentStatus, Permission } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { requireWorkspace, type DevSession } from "@/app/lib/dev-auth";
import { prisma } from "@/app/lib/prisma";

function readOptionalText(formData: FormData, name: string) {
  const value = formData.get(name);

  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  return value.trim();
}

function readRequiredText(formData: FormData, name: string) {
  const value = readOptionalText(formData, name);

  if (!value) {
    throw new Error("Обязательное поле не заполнено.");
  }

  return value;
}

function readAmount(formData: FormData) {
  const value = Number(readRequiredText(formData, "amount"));

  if (!Number.isInteger(value) || value < 0) {
    throw new Error("Сумма должна быть целым неотрицательным числом.");
  }

  return value;
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

function readPaymentStatus(formData: FormData) {
  const value = formData.get("status");

  if (
    value === PaymentStatus.paid ||
    value === PaymentStatus.pending ||
    value === PaymentStatus.overdue ||
    value === PaymentStatus.exempt
  ) {
    return value;
  }

  return PaymentStatus.pending;
}

function readPaymentPeriodType(formData: FormData) {
  const value = formData.get("periodType");

  if (value === PaymentPeriodType.month || value === PaymentPeriodType.course || value === PaymentPeriodType.manual) {
    return value;
  }

  return PaymentPeriodType.month;
}

function requirePaymentWrite(session: DevSession) {
  if (!session.permissions.includes(Permission.payments_write) && !session.permissions.includes(Permission.admin_access)) {
    redirect("/forbidden?required=payments_write");
  }
}

async function readPaymentInput(formData: FormData, organizationId: string) {
  const studentId = readRequiredText(formData, "studentId");
  const courseId = readRequiredText(formData, "courseId");
  const groupId = readOptionalText(formData, "groupId");
  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      organizationId,
      status: { not: "archived" },
    },
    select: { id: true },
  });
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      organizationId,
      status: "active",
    },
    select: { id: true },
  });

  if (!student || !course) {
    notFound();
  }

  if (groupId) {
    const groupLink = await prisma.groupStudent.findFirst({
      where: {
        studentId,
        groupId,
        status: "active",
        group: {
          organizationId,
          courseId,
          status: { not: "archived" },
        },
      },
      select: { id: true },
    });

    if (!groupLink) {
      notFound();
    }
  }

  const periodStart = readOptionalDate(formData, "periodStart");
  const periodEnd = readOptionalDate(formData, "periodEnd");

  if (periodStart && periodEnd && periodEnd < periodStart) {
    throw new Error("Конец периода не может быть раньше начала.");
  }

  return {
    studentId,
    courseId,
    groupId,
    amount: readAmount(formData),
    currency: readRequiredText(formData, "currency").toUpperCase(),
    periodType: readPaymentPeriodType(formData),
    periodStart,
    periodEnd,
    dueAt: readDate(formData, "dueAt"),
    paidAt: readOptionalDate(formData, "paidAt"),
    status: readPaymentStatus(formData),
    comment: readOptionalText(formData, "comment"),
    internalComment: readOptionalText(formData, "internalComment"),
  };
}

async function readCoursePaymentTemplate(formData: FormData) {
  const periodStart = readOptionalDate(formData, "periodStart");
  const periodEnd = readOptionalDate(formData, "periodEnd");

  if (periodStart && periodEnd && periodEnd < periodStart) {
    throw new Error("Конец периода не может быть раньше начала.");
  }

  return {
    amount: readAmount(formData),
    currency: readRequiredText(formData, "currency").toUpperCase(),
    periodType: readPaymentPeriodType(formData),
    periodStart,
    periodEnd,
    dueAt: readDate(formData, "dueAt"),
    paidAt: readOptionalDate(formData, "paidAt"),
    status: readPaymentStatus(formData),
    comment: readOptionalText(formData, "comment"),
    internalComment: readOptionalText(formData, "internalComment"),
  };
}

function valueForHistory(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value === null || value === undefined ? null : String(value);
}

function revalidatePaymentViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/courses");
  revalidatePath("/student");
  revalidatePath("/student/payments");
}

function revalidateCoursePaymentViews(courseId: string) {
  revalidatePaymentViews();
  revalidatePath(`/admin/courses/${courseId}`);
}

function revalidateGroupPaymentViews(courseId: string, groupId: string) {
  revalidateCoursePaymentViews(courseId);
  revalidatePath("/admin/groups");
  revalidatePath(`/admin/groups/${groupId}`);
}

export async function createCoursePayment(courseId: string, formData: FormData) {
  const session = await requireWorkspace("admin");
  requirePaymentWrite(session);
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      organizationId: session.organizationId,
      status: "active",
    },
    include: {
      groups: {
        where: { status: { not: "archived" } },
        include: {
          students: {
            where: { status: "active" },
          },
        },
      },
    },
  });

  if (!course) {
    notFound();
  }

  const template = await readCoursePaymentTemplate(formData);
  const studentIds = Array.from(
    new Set(course.groups.flatMap((group) => group.students.map((link) => link.studentId))),
  );

  await prisma.payment.createMany({
    data: studentIds.map((studentId) => ({
      organizationId: session.organizationId,
      studentId,
      courseId: course.id,
      groupId: null,
      ...template,
      createdById: session.userId,
      updatedById: session.userId,
    })),
  });

  revalidateCoursePaymentViews(courseId);
  redirect(`/admin/courses/${courseId}`);
}

export async function createGroupPayment(groupId: string, formData: FormData) {
  const session = await requireWorkspace("admin");
  requirePaymentWrite(session);
  const group = await prisma.group.findFirst({
    where: {
      id: groupId,
      organizationId: session.organizationId,
      status: { not: "archived" },
    },
    include: {
      students: {
        where: { status: "active" },
      },
    },
  });

  if (!group) {
    notFound();
  }

  const template = await readCoursePaymentTemplate(formData);

  await prisma.payment.createMany({
    data: group.students.map((link) => ({
      organizationId: session.organizationId,
      studentId: link.studentId,
      courseId: group.courseId,
      groupId: group.id,
      ...template,
      createdById: session.userId,
      updatedById: session.userId,
    })),
  });

  revalidateGroupPaymentViews(group.courseId, group.id);
  redirect(`/admin/groups/${group.id}`);
}

export async function updateStudentPayment(studentId: string, paymentId: string, formData: FormData) {
  const session = await requireWorkspace("admin");
  requirePaymentWrite(session);
  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      studentId,
      organizationId: session.organizationId,
    },
    select: { courseId: true },
  });

  if (!payment) {
    notFound();
  }

  formData.set("courseId", payment.courseId);
  formData.set("studentId", studentId);
  await updatePayment(paymentId, session, formData);
  revalidateCoursePaymentViews(payment.courseId);
  revalidatePath(`/admin/students/${studentId}`);
  redirect(`/admin/students/${studentId}`);
}

async function updatePayment(paymentId: string, session: DevSession, formData: FormData) {
  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      organizationId: session.organizationId,
    },
  });

  if (!payment) {
    notFound();
  }

  const next = await readPaymentInput(formData, session.organizationId);

  const trackedFields = [
    "studentId",
    "courseId",
    "groupId",
    "amount",
    "currency",
    "periodType",
    "periodStart",
    "periodEnd",
    "dueAt",
    "paidAt",
    "status",
    "comment",
    "internalComment",
  ] as const;

  const history = trackedFields
    .map((field) => {
      const oldValue = valueForHistory(payment[field]);
      const newValue = valueForHistory(next[field]);
      return oldValue === newValue
        ? null
        : {
            paymentId: payment.id,
            changedById: session.userId,
            field,
            oldValue,
            newValue,
            comment: "Ручное изменение оплаты",
          };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        ...next,
        updatedById: session.userId,
      },
    });

    if (history.length > 0) {
      await tx.paymentHistory.createMany({ data: history });
    }
  });

  revalidatePaymentViews();
}
