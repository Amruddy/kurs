import Link from "next/link";
import { PaymentStatus } from "@prisma/client";
import { groupStatusLabels, paymentStatusLabels } from "@/app/lib/learning-labels";
import { requireWorkspace } from "@/app/lib/dev-auth";
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

function formatPaymentTotal(amount: number | null | undefined) {
  return formatPayment(amount ?? 0, "RUB");
}

export default async function AdminPage() {
  const session = await requireWorkspace("admin");
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const [
    coursesCount,
    groupsCount,
    studentsCount,
    teachersCount,
    overduePaymentCount,
    paidPaymentTotal,
    payablePaymentTotal,
    overduePaymentTotal,
    upcomingLessons,
    groupsForSignals,
    activeScheduleRules,
    controlGroups,
    problemPayments,
  ] = await Promise.all([
    prisma.course.count({
      where: { organizationId: session.organizationId, status: "active" },
    }),
    prisma.group.count({
      where: { organizationId: session.organizationId, status: { not: "archived" } },
    }),
    prisma.student.count({
      where: { organizationId: session.organizationId, status: "active" },
    }),
    prisma.organizationMember.count({
      where: {
        organizationId: session.organizationId,
        status: "active",
        roles: { has: "teacher" },
      },
    }),
    prisma.payment.count({
      where: {
        organizationId: session.organizationId,
        OR: [{ status: PaymentStatus.overdue }, { status: PaymentStatus.pending, dueAt: { lt: today } }],
      },
    }),
    prisma.payment.aggregate({
      where: {
        organizationId: session.organizationId,
        status: PaymentStatus.paid,
      },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        organizationId: session.organizationId,
        status: { not: PaymentStatus.exempt },
      },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        organizationId: session.organizationId,
        OR: [{ status: PaymentStatus.overdue }, { status: PaymentStatus.pending, dueAt: { lt: today } }],
      },
      _sum: { amount: true },
    }),
    prisma.lesson.findMany({
      where: {
        organizationId: session.organizationId,
        startsAt: { gte: now },
      },
      include: {
        course: true,
        group: {
          include: {
            students: {
              where: { status: "active" },
              select: { id: true },
            },
          },
        },
        teacher: true,
      },
      orderBy: { startsAt: "asc" },
      take: 5,
    }),
    prisma.group.findMany({
      where: {
        organizationId: session.organizationId,
        status: { not: "archived" },
      },
      select: {
        id: true,
        teacherId: true,
        students: {
          where: { status: "active" },
          select: { id: true },
        },
      },
    }),
    prisma.scheduleRule.findMany({
      where: {
        organizationId: session.organizationId,
        targetType: "group",
        status: "active",
      },
      select: { targetId: true },
    }),
    prisma.group.findMany({
      where: {
        organizationId: session.organizationId,
        status: { not: "archived" },
      },
      include: {
        course: true,
        teacher: true,
        students: {
          where: { status: "active" },
          select: { id: true },
        },
        lessons: {
          where: { startsAt: { gte: now } },
          orderBy: { startsAt: "asc" },
          take: 1,
        },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 8,
    }),
    prisma.payment.findMany({
      where: {
        organizationId: session.organizationId,
        OR: [{ status: PaymentStatus.overdue }, { status: PaymentStatus.pending, dueAt: { lt: today } }],
      },
      include: {
        student: true,
        course: true,
        group: true,
      },
      orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
      take: 5,
    }),
  ]);

  const scheduledGroupIds = new Set(activeScheduleRules.map((rule) => rule.targetId));
  const groupsWithoutTeacherCount = groupsForSignals.filter((group) => !group.teacherId).length;
  const groupsWithoutScheduleCount = groupsForSignals.filter((group) => !scheduledGroupIds.has(group.id)).length;
  const emptyGroupsCount = groupsForSignals.filter((group) => group.students.length === 0).length;
  const lessonsSignalCount = groupsCount > 0 && upcomingLessons.length === 0 ? 1 : 0;

  const signals = [
    {
      label: "Просроченные оплаты",
      value: overduePaymentCount,
      detail: overduePaymentCount > 0 ? "Нужно проверить сроки и статусы." : "Просроченных оплат нет.",
      tone: overduePaymentCount > 0 ? "danger" : "ok",
    },
    {
      label: "Группы без преподавателя",
      value: groupsWithoutTeacherCount,
      detail: groupsWithoutTeacherCount > 0 ? "Назначьте преподавателя в карточке группы." : "Все группы с преподавателем.",
      tone: groupsWithoutTeacherCount > 0 ? "warning" : "ok",
    },
    {
      label: "Группы без расписания",
      value: groupsWithoutScheduleCount,
      detail: groupsWithoutScheduleCount > 0 ? "Для них не будут создаваться уроки." : "Расписание задано.",
      tone: groupsWithoutScheduleCount > 0 ? "warning" : "ok",
    },
    {
      label: "Группы без учеников",
      value: emptyGroupsCount,
      detail: emptyGroupsCount > 0 ? "Проверьте набор или архивируйте лишнее." : "Пустых групп нет.",
      tone: emptyGroupsCount > 0 ? "warning" : "ok",
    },
    {
      label: "Ближайшие занятия",
      value: lessonsSignalCount,
      detail: lessonsSignalCount > 0 ? "Нет запланированных будущих уроков." : "Будущие уроки есть.",
      tone: lessonsSignalCount > 0 ? "danger" : "ok",
    },
  ];

  return (
    <>
      <section className="director-grid">
        <div className="panel director-main-panel">
          <div className="section-heading">
            <div>
              <span className="status">Ближайшее</span>
              <h2>Занятия на контроле</h2>
            </div>
          </div>
          {upcomingLessons.length === 0 ? (
            <p>Ближайшие уроки пока не созданы. Проверьте расписание групп и генерацию занятий.</p>
          ) : (
            <div className="lesson-list">
              {upcomingLessons.map((lesson) => (
                <article className="lesson-row" key={lesson.id}>
                  <time>{formatDateTime(lesson.startsAt)}</time>
                  <div>
                    {lesson.group ? (
                      <Link href={`/admin/groups/${lesson.group.id}`}>{lesson.group.name}</Link>
                    ) : (
                      <strong>{lesson.course.name}</strong>
                    )}
                    <p>
                      {lesson.course.name} · {lesson.teacher.name} · {lesson.group?.students.length ?? 0} учеников
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="panel director-side-panel">
          <span className="status">Сигналы</span>
          <h2>Требует внимания</h2>
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

      <section className="metric-grid section" aria-label="Основные показатели">
        <div className="panel metric-card">
          <span>Курсы</span>
          <strong>{coursesCount}</strong>
          <p>Активные учебные направления</p>
        </div>
        <div className="panel metric-card">
          <span>Группы</span>
          <strong>{groupsCount}</strong>
          <p>Неархивные группы</p>
        </div>
        <div className="panel metric-card">
          <span>Ученики</span>
          <strong>{studentsCount}</strong>
          <p>Активные ученики</p>
        </div>
        <div className="panel metric-card">
          <span>Преподаватели</span>
          <strong>{teachersCount}</strong>
          <p>Активные сотрудники</p>
        </div>
      </section>

      <section className="director-grid section">
        <div className="panel director-main-panel">
          <div className="section-heading">
            <div>
              <span className="status">Группы</span>
              <h2>Группы под контролем</h2>
            </div>
          </div>
          {controlGroups.length === 0 ? (
            <p>Группы пока не созданы.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Группа</th>
                    <th>Курс</th>
                    <th>Преподаватель</th>
                    <th>Ученики</th>
                    <th>Ближайший урок</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {controlGroups.map((group) => (
                    <tr key={group.id}>
                      <td>
                        <Link href={`/admin/groups/${group.id}`}>{group.name}</Link>
                      </td>
                      <td>{group.course.name}</td>
                      <td>{group.teacher?.name ?? "Не назначен"}</td>
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

        <aside className="panel director-side-panel">
          <span className="status">Оплата</span>
          <h2>Ручной учет</h2>
          <div className="payment-summary">
            <div data-tone="paid">
              <strong>{formatPaymentTotal(paidPaymentTotal._sum.amount)}</strong>
              <span>оплачено</span>
            </div>
            <div data-tone="total">
              <strong>{formatPaymentTotal(payablePaymentTotal._sum.amount)}</strong>
              <span>к оплате всего</span>
            </div>
            <div data-tone="overdue">
              <strong>{formatPaymentTotal(overduePaymentTotal._sum.amount)}</strong>
              <span>просрочено</span>
            </div>
          </div>

          {problemPayments.length === 0 ? (
            <p>Проблемных оплат нет.</p>
          ) : (
            <div className="payment-list">
              {problemPayments.map((payment) => (
                <article className="payment-row" key={payment.id}>
                  <div>
                    <Link href={`/admin/students/${payment.student.id}`}>{payment.student.name}</Link>
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
