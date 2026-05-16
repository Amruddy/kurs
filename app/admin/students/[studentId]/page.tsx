import Link from "next/link";
import { PaymentPeriodType, PaymentStatus } from "@prisma/client";
import { updateStudent } from "@/app/admin/actions";
import { updateStudentPayment } from "@/app/payments/actions";
import {
  groupStudentStatusLabels,
  paymentPeriodTypeLabels,
  paymentStatusLabels,
  studentStatusLabels,
} from "@/app/lib/learning-labels";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { prisma } from "@/app/lib/prisma";

type AdminStudentPageProps = {
  params: Promise<{ studentId: string }>;
};

function dateValue(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

function isPaymentOverdue(payment: { status: PaymentStatus; dueAt: Date }) {
  return payment.status === PaymentStatus.overdue || (payment.status === PaymentStatus.pending && payment.dueAt < new Date());
}

function paymentState(payment: { status: PaymentStatus; dueAt: Date }) {
  if (isPaymentOverdue(payment)) {
    return paymentStatusLabels[PaymentStatus.overdue];
  }

  return paymentStatusLabels[payment.status];
}

export default async function AdminStudentPage({ params }: AdminStudentPageProps) {
  const { studentId } = await params;
  const session = await requireWorkspace("admin");
  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      organizationId: session.organizationId,
    },
    include: {
      groupLinks: {
        include: {
          group: {
            include: {
              course: true,
              teacher: true,
            },
          },
        },
        orderBy: { joinedAt: "desc" },
      },
      payments: {
        include: {
          course: true,
          group: true,
          history: true,
        },
        orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!student) {
    return (
      <section className="panel">
        <h1>Ученик не найден</h1>
        <p>Карточка не существует или относится к другой организации.</p>
      </section>
    );
  }

  const activeGroupLinks = student.groupLinks.filter((link) => link.status === "active");
  const overduePayments = student.payments.filter(isPaymentOverdue);
  const pendingPayments = student.payments.filter(
    (payment) => payment.status === PaymentStatus.pending && !isPaymentOverdue(payment),
  );
  const contactText = [student.phone, student.email].filter(Boolean).join(", ") || "Не указаны";

  return (
    <>
      <div className="page-heading">
        <h1>{student.name}</h1>
      </div>

      <section className="admin-detail-grid">
        <div className="panel admin-main-panel">
          <div className="section-heading">
            <h2>Основные данные</h2>
            <span className="status">{studentStatusLabels[student.status]}</span>
          </div>
          <form className="form-grid" action={updateStudent.bind(null, student.id)}>
            <label>
              Имя
              <input name="name" required defaultValue={student.name} />
            </label>
            <label>
              Телефон
              <input name="phone" defaultValue={student.phone ?? ""} />
            </label>
            <label>
              Email
              <input name="email" type="email" defaultValue={student.email ?? ""} />
            </label>
            <label>
              Статус
              <select name="status" defaultValue={student.status}>
                <option value="active">Активный</option>
                <option value="paused">Приостановлен</option>
                <option value="archived">Архивный</option>
              </select>
            </label>
            <button className="button" type="submit">
              Сохранить
            </button>
          </form>
        </div>

        <aside className="panel admin-side-panel">
          <h2>Состояние ученика</h2>
          <div className="info-list">
            <div className="info-row">
              <span>Контакты</span>
              <strong>{contactText}</strong>
            </div>
            <div className="info-row">
              <span>Активные группы</span>
              <strong>{activeGroupLinks.length}</strong>
            </div>
            <div className="info-row">
              <span>Оплаты к вниманию</span>
              <strong>{overduePayments.length + pendingPayments.length}</strong>
            </div>
          </div>
        </aside>
      </section>

      <section className="metric-grid section" aria-label="Показатели ученика">
        <div className="panel metric-card">
          <span>Группы</span>
          <strong>{activeGroupLinks.length}</strong>
          <p>Активные назначения</p>
        </div>
        <div className="panel metric-card">
          <span>Оплаты</span>
          <strong>{student.payments.length}</strong>
          <p>Записи в системе</p>
        </div>
        <div className="panel metric-card">
          <span>Просрочено</span>
          <strong>{overduePayments.length}</strong>
          <p>Требуют проверки</p>
        </div>
        <div className="panel metric-card">
          <span>Ожидает</span>
          <strong>{pendingPayments.length}</strong>
          <p>По будущему сроку</p>
        </div>
      </section>

      <section className="panel section">
        <h2>Оплата</h2>
        {student.payments.length === 0 ? (
          <p>Для ученика пока нет записей оплаты.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Курс</th>
                  <th>Сумма</th>
                  <th>Срок</th>
                  <th>Статус</th>
                  <th>История</th>
                </tr>
              </thead>
              <tbody>
                {student.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.course.name}</td>
                    <td>
                      {payment.amount} {payment.currency}
                    </td>
                    <td>{payment.dueAt.toLocaleDateString("ru-RU")}</td>
                    <td>{paymentState(payment)}</td>
                    <td>{payment.history.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="section">
        {student.payments.map((payment) => (
          <details className="panel section" key={payment.id}>
            <summary>
              Изменить оплату: {payment.course.name}, {payment.amount} {payment.currency}
            </summary>
            <form className="form-grid" action={updateStudentPayment.bind(null, student.id, payment.id)}>
              <input name="groupId" type="hidden" value={payment.groupId ?? ""} />
              <label>
                Сумма
                <input name="amount" type="number" min="0" defaultValue={payment.amount} required />
              </label>
              <label>
                Валюта
                <input name="currency" defaultValue={payment.currency} required />
              </label>
              <label>
                Период
                <select name="periodType" defaultValue={payment.periodType}>
                  {Object.values(PaymentPeriodType).map((value) => (
                    <option key={value} value={value}>
                      {paymentPeriodTypeLabels[value]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Начало периода
                <input name="periodStart" type="date" defaultValue={dateValue(payment.periodStart)} />
              </label>
              <label>
                Конец периода
                <input name="periodEnd" type="date" defaultValue={dateValue(payment.periodEnd)} />
              </label>
              <label>
                Срок оплаты
                <input name="dueAt" type="date" defaultValue={dateValue(payment.dueAt)} required />
              </label>
              <label>
                Дата оплаты
                <input name="paidAt" type="date" defaultValue={dateValue(payment.paidAt)} />
              </label>
              <label>
                Статус
                <select name="status" defaultValue={payment.status}>
                  {Object.values(PaymentStatus).map((value) => (
                    <option key={value} value={value}>
                      {paymentStatusLabels[value]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Комментарий для ученика
                <input name="comment" defaultValue={payment.comment ?? ""} />
              </label>
              <input name="internalComment" type="hidden" defaultValue={payment.internalComment ?? ""} />
              <button className="button" type="submit">
                Сохранить оплату
              </button>
            </form>
          </details>
        ))}
      </section>

      <section className="panel section">
        <div className="section-heading">
          <h2>Группы ученика</h2>
          <Link className="secondary-button link-button" href="/admin/groups">
            Назначить в группу
          </Link>
        </div>
        {student.groupLinks.length === 0 ? (
          <p>Ученик пока не назначен в группы.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Группа</th>
                  <th>Курс</th>
                  <th>Преподаватель</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {student.groupLinks.map((link) => (
                  <tr key={link.id}>
                    <td>
                      <Link href={`/admin/groups/${link.group.id}`}>{link.group.name}</Link>
                    </td>
                    <td>{link.group.course.name}</td>
                    <td>{link.group.teacher?.name ?? "Не назначен"}</td>
                    <td>{groupStudentStatusLabels[link.status]}</td>
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
