import Link from "next/link";
import { PaymentStatus } from "@prisma/client";
import {
  groupStatusLabels,
  groupStudentStatusLabels,
  paymentStatusLabels,
  scheduleRuleStatusLabels,
  weekdayLabels,
} from "@/app/lib/learning-labels";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { prisma } from "@/app/lib/prisma";

type TeacherGroupPageProps = {
  params: Promise<{ groupId: string }>;
};

function formatDateTime(date: Date) {
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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

export default async function TeacherGroupPage({ params }: TeacherGroupPageProps) {
  const { groupId } = await params;
  const session = await requireWorkspace("teacher");
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const group = await prisma.group.findFirst({
    where: {
      id: groupId,
      organizationId: session.organizationId,
      teacherId: session.userId,
      status: { not: "archived" },
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
          startsAt: { gte: now },
        },
        orderBy: { startsAt: "asc" },
        take: 10,
      },
    },
  });

  if (!group) {
    return (
      <section className="panel">
        <h1>Группа не найдена</h1>
        <p>Группа не существует или не назначена текущему преподавателю.</p>
      </section>
    );
  }

  const [scheduleRules, homeworks, materials, payments] = await Promise.all([
    prisma.scheduleRule.findMany({
      where: {
        organizationId: session.organizationId,
        targetType: "group",
        targetId: group.id,
      },
      orderBy: [{ status: "asc" }, { weekday: "asc" }, { startTime: "asc" }],
    }),
    prisma.homework.findMany({
      where: {
        organizationId: session.organizationId,
        groupId: group.id,
        status: "active",
      },
      include: { student: true, lesson: true },
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      take: 5,
    }),
    prisma.material.findMany({
      where: {
        organizationId: session.organizationId,
        groupId: group.id,
        status: "active",
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.payment.findMany({
      where: {
        organizationId: session.organizationId,
        groupId: group.id,
      },
      include: { student: true, course: true },
      orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
      take: 6,
    }),
  ]);

  const activeStudents = group.students.filter((link) => link.status === "active");
  const activeScheduleRules = scheduleRules.filter((rule) => rule.status === "active");
  const nextLesson = group.lessons[0] ?? null;
  const attentionPayments = payments.filter(
    (payment) => payment.status === PaymentStatus.overdue || (payment.status === PaymentStatus.pending && payment.dueAt < today),
  );

  return (
    <>
      <div className="page-heading">
        <h1>{group.name}</h1>
      </div>

      <section className="teacher-overview-grid">
        <div className="panel teacher-main-panel">
          <span className="status">Ближайшее</span>
          <h2>Следующий урок группы</h2>
          {nextLesson ? (
            <div className="teacher-highlight">
              <strong>{formatDateTime(nextLesson.startsAt)}</strong>
              <p>{group.course.name}</p>
              <div className="button-row">
                <Link className="button link-button compact-button" href={`/teacher/lessons/${nextLesson.id}`}>
                  Открыть урок
                </Link>
                <Link className="secondary-button link-button compact-button" href={`/teacher/groups/${group.id}/journal`}>
                  Открыть журнал
                </Link>
              </div>
            </div>
          ) : (
            <p>Ближайшие уроки пока не созданы.</p>
          )}
        </div>

        <aside className="panel teacher-side-panel">
          <span className="status">Группа</span>
          <h2>Сводка</h2>
          <div className="teacher-list">
            <div className="teacher-list-item">
              <strong>{group.course.name}</strong>
              <span>Курс</span>
            </div>
            <div className="teacher-list-item">
              <strong>{group.teacher?.name ?? "Не назначен"}</strong>
              <span>Преподаватель</span>
            </div>
            <div className="teacher-list-item">
              <strong>{groupStatusLabels[group.status]}</strong>
              <span>Статус группы</span>
            </div>
          </div>
        </aside>
      </section>

      <section className="metric-grid section" aria-label="Показатели группы">
        <div className="panel metric-card">
          <span>Ученики</span>
          <strong>{activeStudents.length}</strong>
          <p>Активный состав</p>
        </div>
        <div className="panel metric-card">
          <span>Расписание</span>
          <strong>{activeScheduleRules.length}</strong>
          <p>Активные правила</p>
        </div>
        <div className="panel metric-card">
          <span>Уроки</span>
          <strong>{group.lessons.length}</strong>
          <p>Ближайшие занятия</p>
        </div>
        <div className="panel metric-card">
          <span>Оплата</span>
          <strong>{attentionPayments.length}</strong>
          <p>Требует внимания</p>
        </div>
      </section>

      <section className="teacher-overview-grid section">
        <div className="panel teacher-main-panel">
          <div className="section-heading">
            <div>
              <span className="status">Расписание</span>
              <h2>Правила занятий</h2>
            </div>
          </div>
          {scheduleRules.length === 0 ? (
            <p>Расписание пока не задано.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>День</th>
                    <th>Время</th>
                    <th>Период</th>
                    <th>Статус</th>
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
                        {formatDate(rule.startsOn)}
                        {rule.endsOn ? ` - ${formatDate(rule.endsOn)}` : ""}
                      </td>
                      <td>{scheduleRuleStatusLabels[rule.status]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="panel teacher-side-panel">
          <span className="status">Уроки</span>
          <h2>Ближайшие даты</h2>
          {group.lessons.length === 0 ? (
            <p>Ближайшие уроки пока не созданы.</p>
          ) : (
            <div className="teacher-list">
              {group.lessons.slice(0, 4).map((lesson) => (
                <article className="teacher-list-item" key={lesson.id}>
                  <Link href={`/teacher/lessons/${lesson.id}`}>{formatDateTime(lesson.startsAt)}</Link>
                  <span>{lesson.topic || "Тема еще не указана"}</span>
                </article>
              ))}
            </div>
          )}
        </aside>
      </section>

      <section className="teacher-overview-grid section">
        <div className="panel teacher-main-panel">
          <div className="section-heading">
            <div>
              <span className="status">Ученики</span>
              <h2>Состав группы</h2>
            </div>
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
                  </tr>
                </thead>
                <tbody>
                  {group.students.map((link) => (
                    <tr key={link.id}>
                      <td>
                        <Link href={`/teacher/students/${link.student.id}`}>{link.student.name}</Link>
                      </td>
                      <td>{[link.student.phone, link.student.email].filter(Boolean).join(", ") || "Не указаны"}</td>
                      <td>{groupStudentStatusLabels[link.status]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="panel teacher-side-panel">
          <span className="status">Оплата</span>
          <h2>Финансовые статусы</h2>
          {payments.length === 0 ? (
            <p>Оплаты по группе пока не настроены.</p>
          ) : (
            <div className="teacher-payment-list">
              {payments.map((payment) => (
                <article className="teacher-payment-row" key={payment.id}>
                  <div>
                    <Link href={`/teacher/students/${payment.student.id}`}>{payment.student.name}</Link>
                    <p>срок {formatDate(payment.dueAt)}</p>
                  </div>
                  <strong>{formatPayment(payment.amount, payment.currency)}</strong>
                  <span>{paymentStatusLabels[payment.status]}</span>
                </article>
              ))}
            </div>
          )}
        </aside>
      </section>

      <section className="teacher-overview-grid section">
        <div className="panel teacher-main-panel">
          <span className="status">Домашние задания</span>
          <h2>Последние задания</h2>
          {homeworks.length === 0 ? (
            <p>Домашние задания пока не созданы.</p>
          ) : (
            <div className="teacher-list">
              {homeworks.map((homework) => (
                <article className="teacher-list-item" key={homework.id}>
                  <strong>{homework.title}</strong>
                  <span>
                    {homework.student?.name ?? "Вся группа"} · {homework.dueAt ? formatDate(homework.dueAt) : "без срока"}
                  </span>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="panel teacher-side-panel">
          <span className="status">Материалы</span>
          <h2>Последние материалы</h2>
          {materials.length === 0 ? (
            <p>Материалы группы пока не добавлены.</p>
          ) : (
            <div className="teacher-list">
              {materials.map((material) => (
                <article className="teacher-list-item" key={material.id}>
                  {material.url ? <a href={material.url}>{material.title}</a> : <strong>{material.title}</strong>}
                  <span>{material.isVisibleToStudent ? "Видно ученикам" : "Скрыто"}</span>
                </article>
              ))}
            </div>
          )}
        </aside>
      </section>
    </>
  );
}
