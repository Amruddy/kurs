import Link from "next/link";
import { PaymentStatus, type PaymentPeriodType } from "@prisma/client";
import { paymentPeriodTypeLabels, paymentStatusLabels } from "@/app/lib/learning-labels";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { prisma } from "@/app/lib/prisma";

type PaymentTotal = {
  currency: string;
  _sum: {
    amount: number | null;
  };
};

function formatDate(date: Date) {
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatPayment(amount: number, currency: string) {
  return `${amount} ${currency}`;
}

function formatPaymentTotals(totals: PaymentTotal[]) {
  if (totals.length === 0) {
    return "0 RUB";
  }

  return totals.map((total) => formatPayment(total._sum.amount ?? 0, total.currency)).join(" / ");
}

function formatPeriod(payment: {
  periodType: PaymentPeriodType;
  periodStart: Date | null;
  periodEnd: Date | null;
}) {
  if (payment.periodStart && payment.periodEnd) {
    return `${formatDate(payment.periodStart)} - ${formatDate(payment.periodEnd)}`;
  }

  if (payment.periodStart) {
    return `с ${formatDate(payment.periodStart)}`;
  }

  if (payment.periodEnd) {
    return `до ${formatDate(payment.periodEnd)}`;
  }

  return paymentPeriodTypeLabels[payment.periodType];
}

function paymentState(payment: { status: PaymentStatus; dueAt: Date }, today: Date) {
  if (payment.status === PaymentStatus.pending && payment.dueAt < today) {
    return paymentStatusLabels[PaymentStatus.overdue];
  }

  return paymentStatusLabels[payment.status];
}

export default async function AdminPaymentsPage() {
  const session = await requireWorkspace("admin");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [payments, paymentsCount, paidTotals, payableTotals, overdueTotals, pendingCount, overdueCount] =
    await Promise.all([
      prisma.payment.findMany({
        where: { organizationId: session.organizationId },
        include: {
          student: true,
          course: true,
          group: true,
        },
        orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
        take: 80,
      }),
      prisma.payment.count({
        where: { organizationId: session.organizationId },
      }),
      prisma.payment.groupBy({
        by: ["currency"],
        where: {
          organizationId: session.organizationId,
          status: PaymentStatus.paid,
        },
        _sum: { amount: true },
        orderBy: { currency: "asc" },
      }),
      prisma.payment.groupBy({
        by: ["currency"],
        where: {
          organizationId: session.organizationId,
          status: { not: PaymentStatus.exempt },
        },
        _sum: { amount: true },
        orderBy: { currency: "asc" },
      }),
      prisma.payment.groupBy({
        by: ["currency"],
        where: {
          organizationId: session.organizationId,
          OR: [{ status: PaymentStatus.overdue }, { status: PaymentStatus.pending, dueAt: { lt: today } }],
        },
        _sum: { amount: true },
        orderBy: { currency: "asc" },
      }),
      prisma.payment.count({
        where: {
          organizationId: session.organizationId,
          status: PaymentStatus.pending,
          dueAt: { gte: today },
        },
      }),
      prisma.payment.count({
        where: {
          organizationId: session.organizationId,
          OR: [{ status: PaymentStatus.overdue }, { status: PaymentStatus.pending, dueAt: { lt: today } }],
        },
      }),
    ]);

  return (
    <>
      <div className="page-heading">
        <span className="status">Оплата</span>
        <h1>Оплата</h1>
        <p>Общий список ручного учета оплат по ученикам, курсам и группам.</p>
      </div>

      <section className="panel">
        <h2>Список оплат</h2>
        {payments.length === 0 ? (
          <p className="empty-state">Оплаты пока не созданы. Массовую оплату можно создать внутри курса или группы.</p>
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
                      <Link href={`/admin/students/${payment.student.id}`}>{payment.student.name}</Link>
                    </td>
                    <td>
                      <Link href={`/admin/courses/${payment.course.id}`}>{payment.course.name}</Link>
                    </td>
                    <td>
                      {payment.group ? (
                        <Link href={`/admin/groups/${payment.group.id}`}>{payment.group.name}</Link>
                      ) : (
                        "Не указана"
                      )}
                    </td>
                    <td>{formatPayment(payment.amount, payment.currency)}</td>
                    <td>{formatDate(payment.dueAt)}</td>
                    <td>{formatPeriod(payment)}</td>
                    <td>{paymentState(payment, today)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="metric-grid section" aria-label="Сводка оплат">
        <div className="panel metric-card payment-metric-card">
          <span>Оплачено</span>
          <strong>{formatPaymentTotals(paidTotals)}</strong>
          <p>Сумма оплат со статусом оплачено</p>
        </div>
        <div className="panel metric-card payment-metric-card">
          <span>К оплате всего</span>
          <strong>{formatPaymentTotals(payableTotals)}</strong>
          <p>Все оплаты, кроме освобожденных</p>
        </div>
        <div className="panel metric-card payment-metric-card">
          <span>Просрочено</span>
          <strong>{formatPaymentTotals(overdueTotals)}</strong>
          <p>{overdueCount} записей требуют внимания</p>
        </div>
        <div className="panel metric-card payment-metric-card">
          <span>Ожидает оплаты</span>
          <strong>{pendingCount}</strong>
          <p>Всего записей: {paymentsCount}</p>
        </div>
      </section>
    </>
  );
}
