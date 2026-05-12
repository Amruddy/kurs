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

export default async function StudentPaymentsPage() {
  const session = await requireWorkspace("student");
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

  return (
    <>
      <div className="page-heading">
        <span className="status">Ученик</span>
        <h1>Оплата</h1>
        <p>Сумма, срок, период и статус оплаты. Онлайн-оплаты в MVP нет.</p>
      </div>

      <section className="panel">
        <h2>Ближайшая оплата</h2>
        {nextPayment ? (
          <p>
            {nextPayment.amount} {nextPayment.currency}, срок {nextPayment.dueAt.toLocaleDateString("ru-RU")},{" "}
            {paymentState(nextPayment)}.
          </p>
        ) : (
          <p>Оплата пока не настроена.</p>
        )}
      </section>

      <section className="panel section">
        <h2>Все оплаты</h2>
        {payments.length === 0 ? (
          <p>Записей оплаты пока нет.</p>
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
                    <td>
                      {payment.amount} {payment.currency}
                    </td>
                    <td>{paymentPeriodTypeLabels[payment.periodType]}</td>
                    <td>{payment.dueAt.toLocaleDateString("ru-RU")}</td>
                    <td>{paymentState(payment)}</td>
                    <td>{payment.comment ?? "Нет"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
