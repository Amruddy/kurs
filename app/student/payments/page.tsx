import { PaymentStatus } from "@prisma/client";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { paymentPeriodTypeLabels, paymentStatusLabels } from "@/app/lib/learning-labels";
import { prisma } from "@/app/lib/prisma";

function paymentState(payment: { status: PaymentStatus; dueAt: Date }) {
  if (payment.status === PaymentStatus.pending && payment.dueAt < new Date()) {
    return "Просрочено";
  }

  return paymentStatusLabels[payment.status];
}

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

export default async function StudentPaymentsPage() {
  const session = await requireWorkspace("student");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const student = await prisma.student.findFirst({
    where: { organizationId: session.organizationId, userId: session.userId },
  });
  const payments = student
    ? await prisma.payment.findMany({
        where: { organizationId: session.organizationId, studentId: student.id },
        include: { course: true, group: true },
        orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      })
    : [];
  const nextPayment =
    payments.find((payment) => payment.status === PaymentStatus.pending || payment.status === PaymentStatus.overdue) ??
    payments[0];
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

      <section className="student-overview-grid">
        <div className="panel student-main-panel">
          <span className="status">Ближайшее</span>
          <h2>Ближайшая оплата</h2>
          {nextPayment ? (
            <div className="student-highlight">
              <strong>{formatPayment(nextPayment.amount, nextPayment.currency)}</strong>
              <p>
                {nextPayment.group ? `${nextPayment.course.name}, ${nextPayment.group.name}` : nextPayment.course.name} · срок{" "}
                {formatDate(nextPayment.dueAt)} · {paymentState(nextPayment)}
              </p>
            </div>
          ) : (
            <p>Оплата пока не настроена.</p>
          )}
        </div>

        <aside className="panel student-side-panel">
          <span className="status">Сводка</span>
          <h2>Ручной учет</h2>
          <div className="payment-summary">
            <div data-tone="paid">
              <strong>{formatPayment(paidTotal)}</strong>
              <span>оплачено</span>
            </div>
            <div data-tone="total">
              <strong>{formatPayment(payableTotal)}</strong>
              <span>к оплате всего</span>
            </div>
            <div data-tone="overdue">
              <strong>{formatPayment(overdueTotal)}</strong>
              <span>просрочено</span>
            </div>
          </div>
        </aside>
      </section>

      <section className="panel section">
        <div className="section-heading">
          <div>
            <span className="status">Список</span>
            <h2>Все оплаты</h2>
          </div>
        </div>
        {payments.length === 0 ? (
          <p className="empty-state">Записей оплаты пока нет.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Контекст</th>
                  <th>Сумма</th>
                  <th>Период</th>
                  <th>Срок</th>
                  <th>Статус</th>
                  <th>Комментарий</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.group ? `${payment.course.name}, ${payment.group.name}` : payment.course.name}</td>
                    <td>{formatPayment(payment.amount, payment.currency)}</td>
                    <td>{formatPeriod(payment)}</td>
                    <td>{formatDate(payment.dueAt)}</td>
                    <td>{paymentState(payment)}</td>
                    <td>{payment.comment ?? "Нет"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="metric-grid section" aria-label="Сводка оплат ученика">
        <div className="panel metric-card payment-metric-card">
          <span>Записи</span>
          <strong>{payments.length}</strong>
          <p>Все оплаты ученика</p>
        </div>
        <div className="panel metric-card payment-metric-card">
          <span>Ожидает</span>
          <strong>{pendingCount}</strong>
          <p>Нужно оплатить вручную</p>
        </div>
        <div className="panel metric-card payment-metric-card">
          <span>Оплачено</span>
          <strong>{formatPayment(paidTotal)}</strong>
          <p>Закрытые оплаты</p>
        </div>
        <div className="panel metric-card payment-metric-card">
          <span>Просрочено</span>
          <strong>{formatPayment(overdueTotal)}</strong>
          <p>Срок уже прошел</p>
        </div>
      </section>
    </>
  );
}
