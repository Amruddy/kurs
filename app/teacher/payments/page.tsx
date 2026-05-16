import Link from "next/link";
import { PaymentStatus } from "@prisma/client";
import { paymentPeriodTypeLabels, paymentStatusLabels } from "@/app/lib/learning-labels";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { prisma } from "@/app/lib/prisma";

function formatDate(date: Date) {
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatPayment(amount: number | null | undefined, currency = "RUB") {
  return `${amount ?? 0} ${currency}`;
}

function formatPeriod(payment: { periodType: string; periodStart: Date | null; periodEnd: Date | null }) {
  const periodLabel = paymentPeriodTypeLabels[payment.periodType as keyof typeof paymentPeriodTypeLabels];

  if (!payment.periodStart && !payment.periodEnd) {
    return periodLabel;
  }

  return `${periodLabel}: ${payment.periodStart ? formatDate(payment.periodStart) : "?"} - ${
    payment.periodEnd ? formatDate(payment.periodEnd) : "?"
  }`;
}

export default async function TeacherPaymentsPage() {
  const session = await requireWorkspace("teacher");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const payments = await prisma.payment.findMany({
    where: {
      organizationId: session.organizationId,
      group: {
        is: {
          teacherId: session.userId,
          status: { not: "archived" },
        },
      },
    },
    include: {
      student: true,
      course: true,
      group: true,
    },
    orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
  });

  const paidTotal = payments
    .filter((payment) => payment.status === PaymentStatus.paid)
    .reduce((sum, payment) => sum + payment.amount, 0);
  const payableTotal = payments
    .filter((payment) => payment.status !== PaymentStatus.exempt)
    .reduce((sum, payment) => sum + payment.amount, 0);
  const overdueTotal = payments
    .filter((payment) => payment.status === PaymentStatus.overdue || (payment.status === PaymentStatus.pending && payment.dueAt < today))
    .reduce((sum, payment) => sum + payment.amount, 0);
  const pendingCount = payments.filter((payment) => payment.status === PaymentStatus.pending).length;

  return (
    <>
      <div className="page-heading">
        <h1>Оплата</h1>
      </div>

      <section className="panel">
        <div className="section-heading">
          <div>
            <span className="status">Список</span>
            <h2>Оплаты учеников</h2>
          </div>
        </div>
        {payments.length === 0 ? (
          <p>Оплаты по вашим группам пока не настроены.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ученик</th>
                  <th>Курс</th>
                  <th>Группа</th>
                  <th>Сумма</th>
                  <th>Срок</th>
                  <th>Период</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      <Link href={`/teacher/students/${payment.student.id}`}>{payment.student.name}</Link>
                    </td>
                    <td>{payment.course.name}</td>
                    <td>
                      {payment.group ? <Link href={`/teacher/groups/${payment.group.id}`}>{payment.group.name}</Link> : "Без группы"}
                    </td>
                    <td>{formatPayment(payment.amount, payment.currency)}</td>
                    <td>{formatDate(payment.dueAt)}</td>
                    <td>{formatPeriod(payment)}</td>
                    <td>{paymentStatusLabels[payment.status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="metric-grid section" aria-label="Сводка оплат преподавателя">
        <div className="panel metric-card payment-metric-card">
          <span>Оплачено</span>
          <strong>{formatPayment(paidTotal)}</strong>
          <p>По вашим группам</p>
        </div>
        <div className="panel metric-card payment-metric-card">
          <span>К оплате всего</span>
          <strong>{formatPayment(payableTotal)}</strong>
          <p>Без освобожденных</p>
        </div>
        <div className="panel metric-card payment-metric-card">
          <span>Просрочено</span>
          <strong>{formatPayment(overdueTotal)}</strong>
          <p>Требует внимания</p>
        </div>
        <div className="panel metric-card payment-metric-card">
          <span>Ожидает</span>
          <strong>{pendingCount}</strong>
          <p>Записи со статусом ожидания</p>
        </div>
      </section>
    </>
  );
}
