import { PaymentStatus } from "@prisma/client";
import Link from "next/link";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { courseStatusLabels, groupStatusLabels, paymentStatusLabels } from "@/app/lib/learning-labels";
import { prisma } from "@/app/lib/prisma";

function formatDateTime(date: Date) {
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function paymentState(payment: { status: PaymentStatus; dueAt: Date }) {
  if (payment.status === PaymentStatus.pending && payment.dueAt < new Date()) {
    return "Просрочено";
  }

  return paymentStatusLabels[payment.status];
}

function paymentTone(payment: { status: PaymentStatus; dueAt: Date }) {
  if (payment.status === PaymentStatus.overdue || payment.dueAt < new Date()) {
    return "danger";
  }

  return "warning";
}

export default async function AdminPage() {
  const session = await requireWorkspace("admin");
  const now = new Date();
  const [
    coursesCount,
    activeCoursesCount,
    groupsCount,
    activeGroupsCount,
    studentsCount,
    activeStudentsCount,
    teachersCount,
    unpaidCount,
    overdueCount,
    nextLesson,
    recentCourses,
    recentGroups,
    unpaidPayments,
  ] = await Promise.all([
    prisma.course.count({ where: { organizationId: session.organizationId } }),
    prisma.course.count({ where: { organizationId: session.organizationId, status: "active" } }),
    prisma.group.count({ where: { organizationId: session.organizationId } }),
    prisma.group.count({ where: { organizationId: session.organizationId, status: "active" } }),
    prisma.student.count({ where: { organizationId: session.organizationId } }),
    prisma.student.count({ where: { organizationId: session.organizationId, status: "active" } }),
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
        status: { in: [PaymentStatus.pending, PaymentStatus.overdue] },
      },
    }),
    prisma.payment.count({
      where: {
        organizationId: session.organizationId,
        OR: [
          { status: PaymentStatus.overdue },
          {
            status: PaymentStatus.pending,
            dueAt: { lt: now },
          },
        ],
      },
    }),
    prisma.lesson.findFirst({
      where: {
        organizationId: session.organizationId,
        startsAt: { gte: now },
      },
      include: {
        group: true,
        course: true,
        teacher: true,
      },
      orderBy: { startsAt: "asc" },
    }),
    prisma.course.findMany({
      where: { organizationId: session.organizationId },
      include: {
        groups: {
          where: { status: { not: "archived" } },
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.group.findMany({
      where: { organizationId: session.organizationId, status: { not: "archived" } },
      include: {
        course: true,
        teacher: true,
        students: { where: { status: "active" }, select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.payment.findMany({
      where: {
        organizationId: session.organizationId,
        status: { in: [PaymentStatus.pending, PaymentStatus.overdue] },
      },
      include: {
        course: true,
        group: true,
        student: true,
      },
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      take: 3,
    }),
  ]);

  return (
    <div className="role-main role-main-admin">
      <header className="role-work-header">
        <div>
          <span className="status role-status">Главная страница</span>
          <p>Организация: {session.organizationName}</p>
        </div>
        <p>Учебная основа, ближайшие уроки и ручная оплата.</p>
      </header>

      <section className="role-state-grid role-state-grid-five" aria-label="Состояние учебной основы">
        <Link className="role-state-card role-state-link" href="/admin/courses">
          <span className="role-state-label">Курсы</span>
          <strong>{coursesCount}</strong>
          <p>Активных: {activeCoursesCount}</p>
        </Link>
        <Link className="role-state-card role-state-link" href="/admin/groups">
          <span className="role-state-label">Группы</span>
          <strong>{groupsCount}</strong>
          <p>Активных: {activeGroupsCount}</p>
        </Link>
        <Link className="role-state-card role-state-link" href="/admin/students">
          <span className="role-state-label">Ученики</span>
          <strong>{studentsCount}</strong>
          <p>Активных: {activeStudentsCount}</p>
        </Link>
        <Link className="role-state-card role-state-link" href="/admin/teachers">
          <span className="role-state-label">Преподаватели</span>
          <strong>{teachersCount}</strong>
          <p>С активным доступом</p>
        </Link>
        <Link className="role-state-card role-state-link" href="/admin/students">
          <span className="role-state-label">Оплата</span>
          <strong>{unpaidCount}</strong>
          <p>Просрочено: {overdueCount}</p>
        </Link>
      </section>

      <div className="role-work-grid role-work-grid-admin">
        <section className="panel role-panel role-primary-panel">
          <div className="role-panel-heading">
            <div>
              <span>Что требует внимания</span>
              <h2>Ожидают оплаты</h2>
            </div>
          </div>
          {unpaidPayments.length === 0 ? (
            <p className="role-empty">Просроченных и ожидающих оплат нет.</p>
          ) : (
            <div className="role-soft-list">
              {unpaidPayments.map((payment) => (
                <div className="role-soft-item" key={payment.id}>
                  <div>
                    <Link href={`/admin/students/${payment.studentId}`}>{payment.student.name}</Link>
                    <p>
                      {payment.amount} {payment.currency}, срок {payment.dueAt.toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                  <span className={`role-badge ${paymentTone(payment)}`}>{paymentState(payment)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel role-panel role-primary-panel">
          <div className="role-panel-heading">
            <div>
              <span>Расписание</span>
              <h2>Ближайший урок</h2>
            </div>
          </div>
          {nextLesson ? (
            <div className="role-feature">
              <strong>{formatDateTime(nextLesson.startsAt)}</strong>
              <p>{nextLesson.group?.name ?? nextLesson.course.name}</p>
              <span>{nextLesson.teacher.name}</span>
            </div>
          ) : (
            <p className="role-empty">Ближайшие уроки пока не созданы.</p>
          )}
        </section>

        <section className="panel role-panel">
          <div className="role-panel-heading">
            <div>
              <span>Группы</span>
              <h2>Активные группы</h2>
            </div>
          </div>
          {recentGroups.length === 0 ? (
            <p className="role-empty">Группы пока не созданы.</p>
          ) : (
            <div className="role-soft-list">
              {recentGroups.map((group) => (
                <div className="role-soft-item" key={group.id}>
                  <div>
                    <Link href={`/admin/groups/${group.id}`}>{group.name}</Link>
                    <p>
                      {group.course.name}, {group.students.length} учеников
                    </p>
                  </div>
                  <div className="role-soft-meta">
                    <span>{group.teacher?.name ?? "Преподаватель не назначен"}</span>
                    <span className="role-badge neutral">{groupStatusLabels[group.status]}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel role-panel">
          <div className="role-panel-heading">
            <div>
              <span>Курсы</span>
              <h2>Последние курсы</h2>
            </div>
          </div>
          {recentCourses.length === 0 ? (
            <p className="role-empty">Курсы пока не созданы.</p>
          ) : (
            <div className="role-soft-list">
              {recentCourses.map((course) => (
                <div className="role-soft-item" key={course.id}>
                  <div>
                    <Link href={`/admin/courses/${course.id}`}>{course.name}</Link>
                    <p>{course.groups.length} групп</p>
                  </div>
                  <span className="role-badge neutral">{courseStatusLabels[course.status]}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
