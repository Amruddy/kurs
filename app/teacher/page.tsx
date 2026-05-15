import Link from "next/link";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { groupStatusLabels } from "@/app/lib/learning-labels";
import { prisma } from "@/app/lib/prisma";

function formatDateTime(date: Date) {
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function TeacherPage() {
  const session = await requireWorkspace("teacher");
  const now = new Date();
  const [groups, nextLesson, homeworksCount, materialsCount] = await Promise.all([
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
  ]);
  const studentsCount = groups.reduce((total, group) => total + group.students.length, 0);

  return (
    <div className="role-main role-main-teacher">
      <header className="role-work-header">
        <div>
          <span className="status role-status">Главная страница</span>
          <p>Организация: {session.organizationName}</p>
        </div>
        <p>
          {session.name} · {session.email}
        </p>
      </header>

      <section className="role-state-grid role-state-grid-five" aria-label="Рабочее состояние преподавателя">
        <Link className="role-state-card role-state-link" href="/teacher/groups">
          <span className="role-state-label">Группы</span>
          <strong>{groups.length}</strong>
          <p>Назначенных</p>
        </Link>
        <Link className="role-state-card role-state-link" href="/teacher/students">
          <span className="role-state-label">Ученики</span>
          <strong>{studentsCount}</strong>
          <p>Активных</p>
        </Link>
        <Link className="role-state-card role-state-link" href={nextLesson ? `/teacher/lessons/${nextLesson.id}` : "/teacher/attendance"}>
          <span className="role-state-label">Урок</span>
          <strong>{nextLesson ? 1 : 0}</strong>
          <p>{nextLesson ? formatDateTime(nextLesson.startsAt) : "Нет ближайшего"}</p>
        </Link>
        <Link className="role-state-card role-state-link" href="/teacher/homework">
          <span className="role-state-label">ДЗ</span>
          <strong>{homeworksCount}</strong>
          <p>Активных</p>
        </Link>
        <Link className="role-state-card role-state-link" href="/teacher/materials">
          <span className="role-state-label">Материалы</span>
          <strong>{materialsCount}</strong>
          <p>Активных</p>
        </Link>
      </section>

      <div className="role-work-grid">
        <section className="panel role-panel role-primary-panel">
          <div className="role-panel-heading">
            <div>
              <span>Что требует внимания</span>
              <h2>Ближайший урок</h2>
            </div>
          </div>
          {nextLesson ? (
            <div className="role-feature">
              <strong>{formatDateTime(nextLesson.startsAt)}</strong>
              <p>{nextLesson.group?.name ?? nextLesson.course.name}</p>
              <span>{nextLesson.course.name}</span>
              <Link className="button link-button compact-button" href={`/teacher/lessons/${nextLesson.id}`}>
                Открыть урок
              </Link>
            </div>
          ) : (
            <p className="role-empty">Ближайшие уроки пока не созданы.</p>
          )}
        </section>

        <section className="panel role-panel role-panel-wide">
          <div className="role-panel-heading">
            <div>
              <span>Группы</span>
              <h2>Мои группы</h2>
            </div>
          </div>
          {groups.length === 0 ? (
            <p className="role-empty">Пока нет назначенных групп.</p>
          ) : (
            <div className="role-soft-list">
              {groups.map((group) => (
                <Link className="role-soft-item role-soft-item-link" href={`/teacher/groups/${group.id}`} key={group.id}>
                  <div>
                    <strong>{group.name}</strong>
                    <p>
                      {group.course.name}, {group.students.length} учеников
                    </p>
                  </div>
                  <div className="role-soft-meta">
                    <span>{group.lessons[0] ? formatDateTime(group.lessons[0].startsAt) : "Нет уроков"}</span>
                    <span className="role-badge neutral">{groupStatusLabels[group.status]}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
