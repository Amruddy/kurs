import Link from "next/link";
import { PaymentPeriodType, PaymentStatus, Role } from "@prisma/client";
import {
  addStudentToGroup,
  createGroupScheduleRule,
  createStudentInGroup,
  deleteScheduleRule,
  generateLessonsForGroup,
  removeStudentFromGroup,
  updateGroup,
} from "@/app/admin/actions";
import { createGroupPayment, updateStudentPayment } from "@/app/payments/actions";
import {
  groupStatusLabels,
  groupStudentStatusLabels,
  paymentPeriodTypeLabels,
  paymentStatusLabels,
  scheduleRuleStatusLabels,
  weekdayLabels,
} from "@/app/lib/learning-labels";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { prisma } from "@/app/lib/prisma";

type AdminGroupPageProps = {
  params: Promise<{ groupId: string }>;
};

function paymentState(payment: { status: PaymentStatus; dueAt: Date }) {
  if (payment.status === PaymentStatus.pending && payment.dueAt < new Date()) {
    return "Просрочено для отображения";
  }

  return paymentStatusLabels[payment.status];
}

function dateValue(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

export default async function AdminGroupPage({ params }: AdminGroupPageProps) {
  const { groupId } = await params;
  const session = await requireWorkspace("admin");
  const [group, teachers, students] = await Promise.all([
    prisma.group.findFirst({
      where: {
        id: groupId,
        organizationId: session.organizationId,
      },
      include: {
        course: true,
        teacher: true,
        students: {
          include: { student: true },
          orderBy: { joinedAt: "desc" },
        },
        lessons: {
          where: {
            startsAt: { gte: new Date() },
          },
          orderBy: { startsAt: "asc" },
          take: 10,
        },
        payments: {
          include: {
            student: true,
            history: true,
          },
          orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
        },
      },
    }),
    prisma.organizationMember.findMany({
      where: {
        organizationId: session.organizationId,
        status: "active",
        roles: { has: Role.teacher },
      },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.student.findMany({
      where: {
        organizationId: session.organizationId,
        status: { not: "archived" },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!group) {
    return (
      <section className="panel">
        <h1>Группа не найдена</h1>
        <p>Группа не существует или относится к другой организации.</p>
      </section>
    );
  }

  const activeStudentIds = new Set(
    group.students.filter((link) => link.status === "active").map((link) => link.studentId),
  );
  const availableStudents = students.filter((student) => !activeStudentIds.has(student.id));
  const scheduleRules = await prisma.scheduleRule.findMany({
    where: {
      organizationId: session.organizationId,
      targetType: "group",
      targetId: group.id,
    },
    orderBy: [{ status: "asc" }, { weekday: "asc" }, { startTime: "asc" }],
  });

  return (
    <>
      <div className="page-heading">
        <span className="status">{groupStatusLabels[group.status]}</span>
        <h1>{group.name}</h1>
        <p>
          {group.course.name}. Преподаватель: {group.teacher?.name ?? "не назначен"}.
        </p>
      </div>

      <section className="group-workspace">
        <div className="panel">
          <div className="section-heading">
            <h2>Состав группы</h2>
            <span className="status">{activeStudentIds.size} активных</span>
          </div>
          {group.students.length === 0 ? (
            <p>В группе пока нет учеников.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Ученик</th>
                    <th>Контакты</th>
                    <th>Статус</th>
                    <th>Действие</th>
                  </tr>
                </thead>
                <tbody>
                  {group.students.map((link) => (
                    <tr key={link.id}>
                      <td>
                        <Link href={`/admin/students/${link.student.id}`}>{link.student.name}</Link>
                      </td>
                      <td>{[link.student.phone, link.student.email].filter(Boolean).join(", ") || "Не указаны"}</td>
                      <td>{groupStudentStatusLabels[link.status]}</td>
                      <td>
                        {link.status === "active" ? (
                          <form action={removeStudentFromGroup.bind(null, link.id, group.id)}>
                            <button className="secondary-button compact-button" type="submit">
                              Убрать
                            </button>
                          </form>
                        ) : (
                          "История сохранена"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="panel">
          <h2>Ближайшие уроки</h2>
          {group.lessons.length === 0 ? (
            <p>Ближайшие уроки пока не созданы.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Время</th>
                  </tr>
                </thead>
                <tbody>
                  {group.lessons.map((lesson) => (
                    <tr key={lesson.id}>
                      <td>{lesson.startsAt.toLocaleDateString("ru-RU")}</td>
                      <td>
                        {lesson.startsAt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                        {lesson.endsAt
                          ? `-${lesson.endsAt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`
                          : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="panel section">
        <h2>Оплаты учеников группы</h2>
        {group.payments.length === 0 ? (
          <p>Оплаты по этой группе пока не созданы.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ученик</th>
                  <th>Сумма</th>
                  <th>Срок</th>
                  <th>Статус</th>
                  <th>Изменить статус</th>
                </tr>
              </thead>
              <tbody>
                {group.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      <Link href={`/admin/students/${payment.studentId}`}>{payment.student.name}</Link>
                    </td>
                    <td>
                      {payment.amount} {payment.currency}
                    </td>
                    <td>{payment.dueAt.toLocaleDateString("ru-RU")}</td>
                    <td>{paymentState(payment)}</td>
                    <td>
                      <form className="inline-form" action={updateStudentPayment.bind(null, payment.studentId, payment.id)}>
                        <input name="groupId" type="hidden" value={payment.groupId ?? ""} />
                        <input name="amount" type="hidden" value={payment.amount} />
                        <input name="currency" type="hidden" value={payment.currency} />
                        <input name="periodType" type="hidden" value={payment.periodType} />
                        <input name="periodStart" type="hidden" value={dateValue(payment.periodStart)} />
                        <input name="periodEnd" type="hidden" value={dateValue(payment.periodEnd)} />
                        <input name="dueAt" type="hidden" value={dateValue(payment.dueAt)} />
                        <input name="paidAt" type="hidden" value={dateValue(payment.paidAt)} />
                        <input name="comment" type="hidden" value={payment.comment ?? ""} />
                        <input name="internalComment" type="hidden" value={payment.internalComment ?? ""} />
                        <select name="status" defaultValue={payment.status}>
                          {Object.values(PaymentStatus).map((value) => (
                            <option key={value} value={value}>
                              {paymentStatusLabels[value]}
                            </option>
                          ))}
                        </select>
                        <button className="secondary-button compact-button" type="submit">
                          Сохранить
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="settings-stack section">
        <details className="panel">
          <summary>Настройки группы</summary>
          <form className="form-grid section" action={updateGroup.bind(null, group.id)}>
            <label>
              Название
              <input name="name" required defaultValue={group.name} />
            </label>
            <label>
              Преподаватель
              <select name="teacherId" defaultValue={group.teacherId ?? ""}>
                <option value="">Назначить позже</option>
                {teachers.map((teacher) => (
                  <option key={teacher.userId} value={teacher.userId}>
                    {teacher.user.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Статус
              <select name="status" defaultValue={group.status}>
                <option value="recruiting">Набор</option>
                <option value="active">Активная</option>
                <option value="paused">Приостановлена</option>
                <option value="completed">Завершена</option>
                <option value="archived">Архивная</option>
              </select>
            </label>
            <button className="button" type="submit">
              Сохранить
            </button>
          </form>
        </details>

        <details className="panel">
          <summary>Добавить ученика</summary>
          <form className="form-grid section" action={addStudentToGroup.bind(null, group.id)}>
            <label>
              Ученик
              <select name="studentId" required defaultValue="">
                <option value="" disabled>
                  Выберите ученика
                </option>
                {availableStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="button" type="submit" disabled={availableStudents.length === 0}>
              Добавить в группу
            </button>
          </form>
          {availableStudents.length === 0 ? <p className="form-note">Нет доступных учеников для добавления.</p> : null}

          <h3 className="subsection-title">Новый ученик</h3>
          <form className="form-grid" action={createStudentInGroup.bind(null, group.id)}>
            <label>
              Имя
              <input name="name" required placeholder="Имя ученика" />
            </label>
            <label>
              Телефон
              <input name="phone" placeholder="+7..." />
            </label>
            <label>
              Email
              <input name="email" type="email" placeholder="student@example.test" />
            </label>
            <button className="button" type="submit">
              Создать и добавить
            </button>
          </form>
        </details>

        <details className="panel">
          <summary>Расписание</summary>
          <form className="form-grid section" action={createGroupScheduleRule.bind(null, group.id)}>
            <label>
              День недели
              <select name="weekday" defaultValue="0">
                <option value="1">Понедельник</option>
                <option value="2">Вторник</option>
                <option value="3">Среда</option>
                <option value="4">Четверг</option>
                <option value="5">Пятница</option>
                <option value="6">Суббота</option>
                <option value="0">Воскресенье</option>
              </select>
            </label>
            <label>
              Начало
              <input name="startTime" required type="time" defaultValue="10:00" />
            </label>
            <label>
              Окончание
              <input name="endTime" type="time" defaultValue="11:00" />
            </label>
            <label>
              Действует с
              <input name="startsOn" required type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
            </label>
            <label>
              Действует до
              <input name="endsOn" type="date" />
            </label>
            <button className="button" type="submit">
              Добавить расписание
            </button>
          </form>

          {scheduleRules.length === 0 ? (
            <p className="form-note">Расписание пока не задано.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>День</th>
                    <th>Время</th>
                    <th>Период</th>
                    <th>Статус</th>
                    <th>Действие</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduleRules.map((rule) => (
                    <tr key={rule.id}>
                      <td>{weekdayLabels[rule.weekday]}</td>
                      <td>
                        {rule.startTime}
                        {rule.endTime ? `-${rule.endTime}` : ""}
                      </td>
                      <td>
                        {rule.startsOn.toLocaleDateString("ru-RU")}
                        {rule.endsOn ? ` - ${rule.endsOn.toLocaleDateString("ru-RU")}` : ""}
                      </td>
                      <td>{scheduleRuleStatusLabels[rule.status]}</td>
                      <td>
                        <form action={deleteScheduleRule.bind(null, rule.id, group.id)}>
                          <button className="secondary-button compact-button" type="submit">
                            Удалить
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <form className="section" action={generateLessonsForGroup.bind(null, group.id)}>
            <button className="button compact-button" type="submit" disabled={!group.teacherId || scheduleRules.length === 0}>
              Создать уроки на месяц
            </button>
          </form>
          {!group.teacherId ? <p className="form-note">Чтобы создать уроки, назначьте преподавателя.</p> : null}
        </details>

        <details className="panel">
          <summary>Создать оплату группе</summary>
          <p>Создайте одинаковую оплату сразу для всех активных учеников этой группы.</p>
          <form className="form-grid section" action={createGroupPayment.bind(null, group.id)}>
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
              <select name="periodType" defaultValue={PaymentPeriodType.month}>
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
            <button className="button" type="submit" disabled={activeStudentIds.size === 0}>
              Создать оплату группе
            </button>
          </form>
          {activeStudentIds.size === 0 ? <p className="form-note">Сначала добавьте учеников в группу.</p> : null}
        </details>
      </section>
    </>
  );
}
