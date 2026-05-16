import Link from "next/link";
import { PaymentStatus } from "@prisma/client";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { groupStatusLabels, paymentStatusLabels } from "@/app/lib/learning-labels";
import { prisma } from "@/app/lib/prisma";

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

export default async function TeacherPage() {
  const session = await requireWorkspace("teacher");
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const [groups, nextLesson, activeHomeworkCount, activeMaterialCount, paymentsNeedingAttention] = await Promise.all([
    prisma.group.findMany({
      where: {
        organizationId: session.organizationId,
        teacherId: session.userId,
        status: { not: "archived" },
      },
      include: {
        course: true,
        students: {
          where: { status: "active" },
        },
        lessons: {
          where: {
            startsAt: { gte: now },
          },
          orderBy: { startsAt: "asc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.lesson.findFirst({
      where: {
        organizationId: session.organizationId,
        teacherId: session.userId,
        startsAt: { gte: now },
      },
      include: {
        group: true,
        course: true,
      },
      orderBy: { startsAt: "asc" },
    }),
    prisma.homework.count({
      where: {
        organizationId: session.organizationId,
        authorId: session.userId,
        status: "active",
      },
    }),
    prisma.material.count({
      where: {
        organizationId: session.organizationId,
        authorId: session.userId,
        status: "active",
      },
    }),
    prisma.payment.findMany({
      where: {
        organizationId: session.organizationId,
        group: {
          is: {
            teacherId: session.userId,
            status: { not: "archived" },
          },
        },
        OR: [{ status: PaymentStatus.overdue }, { status: PaymentStatus.pending, dueAt: { lt: today } }],
      },
      include: {
        student: true,
        course: true,
        group: true,
      },
      orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
      take: 4,
    }),
  ]);

  const studentCount = new Set(groups.flatMap((group) => group.students.map((link) => link.studentId))).size;
  const groupsWithoutStudentsCount = groups.filter((group) => group.students.length === 0).length;
  const nextLessonGroup = nextLesson?.group;
  const signals = [
    {
      label: "Ближайший урок",
      value: nextLesson ? "1" : "0",
      detail: nextLesson ? `${formatDateTime(nextLesson.startsAt)} · ${nextLessonGroup?.name ?? nextLesson.course.name}` : "Будущих уроков пока нет.",
      tone: nextLesson ? "ok" : "warning",
    },
    {
      label: "Группы без учеников",
      value: groupsWithoutStudentsCount,
      detail: groupsWithoutStudentsCount > 0 ? "Проверьте состав групп." : "Все активные группы с учениками.",
      tone: groupsWithoutStudentsCount > 0 ? "warning" : "ok",
    },
    {
      label: "Оплата требует внимания",
      value: paymentsNeedingAttention.length,
      detail: paymentsNeedingAttention.length > 0 ? "Есть ожидающие или просроченные оплаты." : "Критичных оплат нет.",
      tone: paymentsNeedingAttention.length > 0 ? "danger" : "ok",
    },
  ];

  return (
    <>
      <section className="teacher-overview-grid">
        <div className="panel teacher-main-panel">
          <span className="status">Ближайшее</span>
          <h2>Следующий урок</h2>
          {nextLesson ? (
            <div className="teacher-highlight">
              <strong>{formatDateTime(nextLesson.startsAt)}</strong>
              <p>
                {nextLessonGroup?.name ?? nextLesson.course.name} · {nextLesson.course.name}
              </p>
              <div className="button-row">
                <Link className="button link-button compact-button" href={`/teacher/lessons/${nextLesson.id}`}>
                  Открыть урок
                </Link>
                {nextLessonGroup ? (
                  <Link className="secondary-button link-button compact-button" href={`/teacher/groups/${nextLessonGroup.id}/journal`}>
                    Открыть журнал
                  </Link>
                ) : null}
              </div>
            </div>
          ) : (
            <p>Ближайшие уроки пока не созданы.</p>
          )}
        </div>

        <aside className="panel teacher-side-panel">
          <span className="status">Сигналы</span>
          <h2>Что проверить</h2>
          <div className="signal-list">
            {signals.map((signal) => (
              <div className="signal-item" data-tone={signal.tone} key={signal.label}>
                <strong>{signal.value}</strong>
                <div>
                  <span>{signal.label}</span>
                  <p>{signal.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="metric-grid section" aria-label="Показатели преподавателя">
        <div className="panel metric-card">
          <span>Группы</span>
          <strong>{groups.length}</strong>
          <p>Активные назначенные группы</p>
        </div>
        <div className="panel metric-card">
          <span>Ученики</span>
          <strong>{studentCount}</strong>
          <p>В активном составе групп</p>
        </div>
        <div className="panel metric-card">
          <span>Домашние задания</span>
          <strong>{activeHomeworkCount}</strong>
          <p>Активные задания преподавателя</p>
        </div>
        <div className="panel metric-card">
          <span>Материалы</span>
          <strong>{activeMaterialCount}</strong>
          <p>Тексты и ссылки в работе</p>
        </div>
      </section>

      <section className="teacher-overview-grid section">
        <div className="panel teacher-main-panel">
          <div className="section-heading">
            <div>
              <span className="status">Группы</span>
              <h2>Учебная работа</h2>
            </div>
          </div>

          {groups.length === 0 ? (
            <p>Пока нет назначенных групп.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Группа</th>
                    <th>Курс</th>
                    <th>Ученики</th>
                    <th>Ближайший урок</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    <tr key={group.id}>
                      <td>
                        <Link href={`/teacher/groups/${group.id}`}>{group.name}</Link>
                      </td>
                      <td>{group.course.name}</td>
                      <td>{group.students.length}</td>
                      <td>{group.lessons[0] ? formatDateTime(group.lessons[0].startsAt) : "Нет"}</td>
                      <td>{groupStatusLabels[group.status]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="panel teacher-side-panel">
          <span className="status">Оплата</span>
          <h2>Нужны напоминания</h2>
          {paymentsNeedingAttention.length === 0 ? (
            <p>Просроченных или ожидающих оплат по вашим группам нет.</p>
          ) : (
            <div className="teacher-payment-list">
              {paymentsNeedingAttention.map((payment) => (
                <article className="teacher-payment-row" key={payment.id}>
                  <div>
                    <Link href={`/teacher/students/${payment.student.id}`}>{payment.student.name}</Link>
                    <p>
                      {payment.group?.name ?? payment.course.name} · срок {formatDate(payment.dueAt)}
                    </p>
                  </div>
                  <strong>{formatPayment(payment.amount, payment.currency)}</strong>
                  <span>{paymentStatusLabels[payment.status]}</span>
                </article>
              ))}
            </div>
          )}
        </aside>
      </section>
    </>
  );
}
