import Link from "next/link";
import { PaymentPeriodType, PaymentStatus } from "@prisma/client";
import { archiveCourse, updateCourse } from "@/app/admin/actions";
import { createCoursePayment } from "@/app/payments/actions";
import {
  courseFormatLabels,
  courseStatusLabels,
  groupStatusLabels,
  lessonMarkScaleLabels,
  paymentPeriodTypeLabels,
  paymentStatusLabels,
} from "@/app/lib/learning-labels";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { prisma } from "@/app/lib/prisma";

type AdminCoursePageProps = {
  params: Promise<{ courseId: string }>;
};

function paymentState(payment: { status: PaymentStatus; dueAt: Date }) {
  if (payment.status === PaymentStatus.pending && payment.dueAt < new Date()) {
    return "Просрочено для отображения";
  }

  return paymentStatusLabels[payment.status];
}

export default async function AdminCoursePage({ params }: AdminCoursePageProps) {
  const { courseId } = await params;
  const session = await requireWorkspace("admin");
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      organizationId: session.organizationId,
    },
    include: {
      progressSettings: true,
      groups: {
        include: {
          teacher: true,
          students: {
            include: { student: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      payments: {
        include: {
          student: true,
          group: true,
          history: true,
        },
        orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!course) {
    return (
      <section className="panel">
        <h1>Курс не найден</h1>
        <p>Курс не существует или относится к другой организации.</p>
      </section>
    );
  }

  const courseStudentCount = new Set(
    course.groups.flatMap((group) =>
      group.students.filter((link) => link.status === "active").map((link) => link.studentId),
    ),
  ).size;
  const unpaid = course.payments.filter(
    (payment) => payment.status === PaymentStatus.pending || payment.status === PaymentStatus.overdue,
  );

  return (
    <>
      <div className="page-heading">
        <span className="status">{courseStatusLabels[course.status]}</span>
        <h1>{course.name}</h1>
        <p>{course.description || "Описание пока не заполнено."}</p>
      </div>

      <section className="grid">
        <div className="panel">
          <h2>{courseFormatLabels[course.format]}</h2>
          <p>Формат обучения</p>
        </div>
        <div className="panel">
          <h2>{course.lessonMarkScale ? lessonMarkScaleLabels[course.lessonMarkScale] : "Нет"}</h2>
          <p>Шкала оценки</p>
        </div>
        <div className="panel">
          <h2>{course.progressSettings?.isProgressEnabled ? "Включен" : "Выключен"}</h2>
          <p>Таджвид-прогресс</p>
        </div>
        <div className="panel">
          <h2>{unpaid.length}</h2>
          <p>Ожидают оплаты</p>
        </div>
      </section>

      <section className="panel section">
        <h2>Настройки курса</h2>
        <form className="form-grid" action={updateCourse.bind(null, course.id)}>
          <label>
            Название
            <input name="name" required defaultValue={course.name} />
          </label>
          <label>
            Описание
            <input name="description" defaultValue={course.description ?? ""} />
          </label>
          <label>
            Формат
            <select name="format" defaultValue={course.format}>
              <option value="group">Группы</option>
              <option value="individual">Индивидуально</option>
              <option value="both">Группы и индивидуально</option>
            </select>
          </label>
          <label>
            Шкала оценки
            <select name="lessonMarkScale" defaultValue={course.lessonMarkScale ?? ""}>
              <option value="">Без оценки</option>
              <option value="five_point">5-балльная</option>
              <option value="ten_point">10-балльная</option>
            </select>
          </label>
          <label className="checkbox-label">
            <input
              name="isProgressEnabled"
              type="checkbox"
              defaultChecked={course.progressSettings?.isProgressEnabled ?? true}
            />
            Включить таджвид-прогресс
          </label>
          <button className="button" type="submit">
            Сохранить курс
          </button>
        </form>
      </section>

      <section className="panel section">
        <h2>Оплата курса</h2>
        <p>Создайте одинаковую оплату сразу для всех активных учеников курса. Отдельные исправления делаются в карточке ученика.</p>
        <form className="form-grid" action={createCoursePayment.bind(null, course.id)}>
          <label>
            Сумма
            <input name="amount" type="number" min="0" required />
          </label>
          <label>
            Валюта
            <input name="currency" defaultValue="RUB" required />
          </label>
          <label>
            Период
            <select name="periodType" defaultValue={PaymentPeriodType.course}>
              {Object.values(PaymentPeriodType).map((value) => (
                <option key={value} value={value}>
                  {paymentPeriodTypeLabels[value]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Начало периода
            <input name="periodStart" type="date" />
          </label>
          <label>
            Конец периода
            <input name="periodEnd" type="date" />
          </label>
          <label>
            Срок оплаты
            <input name="dueAt" type="date" required />
          </label>
          <label>
            Дата оплаты
            <input name="paidAt" type="date" />
          </label>
          <label>
            Статус
            <select name="status" defaultValue={PaymentStatus.pending}>
              {Object.values(PaymentStatus).map((value) => (
                <option key={value} value={value}>
                  {paymentStatusLabels[value]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Комментарий для ученика
            <input name="comment" />
          </label>
          <input name="internalComment" type="hidden" />
          <button className="button" type="submit" disabled={courseStudentCount === 0}>
            Создать для всех учеников
          </button>
        </form>
        {courseStudentCount === 0 ? <p className="form-note">В курсе пока нет активных учеников.</p> : null}
      </section>

      <section className="panel section">
        <h2>Оплаты учеников</h2>
        {course.payments.length === 0 ? (
          <p>Оплаты по этому курсу пока не созданы.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ученик</th>
                  <th>Сумма</th>
                  <th>Период</th>
                  <th>Срок</th>
                  <th>Статус</th>
                  <th>История</th>
                </tr>
              </thead>
              <tbody>
                {course.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      <Link href={`/admin/students/${payment.studentId}`}>{payment.student.name}</Link>
                    </td>
                    <td>
                      {payment.amount} {payment.currency}
                    </td>
                    <td>{paymentPeriodTypeLabels[payment.periodType]}</td>
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

      <section className="panel section">
        <div className="section-heading">
          <h2>Группы курса</h2>
          <Link className="secondary-button link-button" href={`/admin/groups?courseId=${course.id}`}>
            + Создать группу
          </Link>
        </div>
        {course.groups.length === 0 ? (
          <p>К этому курсу еще не привязаны группы.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Группа</th>
                  <th>Преподаватель</th>
                  <th>Ученики</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {course.groups.map((group) => (
                  <tr key={group.id}>
                    <td>
                      <Link href={`/admin/groups/${group.id}`}>{group.name}</Link>
                    </td>
                    <td>{group.teacher?.name ?? "Не назначен"}</td>
                    <td>{group.students.filter((student) => student.status === "active").length}</td>
                    <td>{groupStatusLabels[group.status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {course.status === "active" ? (
        <form className="section" action={archiveCourse.bind(null, course.id)}>
          <button className="secondary-button" type="submit">
            Архивировать курс
          </button>
        </form>
      ) : null}
    </>
  );
}
