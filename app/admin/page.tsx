import Link from "next/link";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { prisma } from "@/app/lib/prisma";

export default async function AdminPage() {
  const session = await requireWorkspace("admin");
  const [coursesCount, groupsCount, studentsCount, teachersCount, unpaidCount, nextLesson] = await Promise.all([
    prisma.course.count({ where: { organizationId: session.organizationId } }),
    prisma.group.count({ where: { organizationId: session.organizationId } }),
    prisma.student.count({ where: { organizationId: session.organizationId } }),
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
        status: { in: ["pending", "overdue"] },
      },
    }),
    prisma.lesson.findFirst({
      where: {
        organizationId: session.organizationId,
        startsAt: { gte: new Date() },
      },
      include: {
        group: true,
        course: true,
        teacher: true,
      },
      orderBy: { startsAt: "asc" },
    }),
  ]);

  return (
    <>
      <div className="page-heading">
        <span className="status">Админ</span>
        <h1>Административная область</h1>
        <p>
          Учебная основа организации: курсы, преподаватели, ученики, группы, расписание, журнал и ручная оплата.
        </p>
      </div>

      <section className="panel section">
        <h2>Разделы</h2>
        <div className="action-grid">
          <Link className="secondary-button link-button" href="/admin/courses">
            Курсы
          </Link>
          <Link className="secondary-button link-button" href="/admin/groups">
            Группы
          </Link>
          <Link className="secondary-button link-button" href="/admin/students">
            Ученики
          </Link>
          <Link className="secondary-button link-button" href="/admin/teachers">
            Преподаватели
          </Link>
        </div>
      </section>

      <section className="panel quick-actions">
        <h2>Быстрые действия</h2>
        <div className="action-grid">
          <Link className="button link-button" href="/admin/courses">
            Добавить курс
          </Link>
          <Link className="button link-button" href="/admin/groups">
            Добавить группу
          </Link>
          <Link className="button link-button" href="/admin/students">
            Добавить ученика
          </Link>
          <Link className="button link-button" href="/admin/teachers">
            Добавить преподавателя
          </Link>
        </div>
      </section>

      <section className="grid section">
        <div className="panel">
          <h2>{coursesCount}</h2>
          <p>Курсов</p>
        </div>
        <div className="panel">
          <h2>{groupsCount}</h2>
          <p>Групп</p>
        </div>
        <div className="panel">
          <h2>{studentsCount}</h2>
          <p>Учеников</p>
        </div>
        <div className="panel">
          <h2>{teachersCount}</h2>
          <p>Преподавателей</p>
        </div>
        <div className="panel">
          <h2>{unpaidCount}</h2>
          <p>Ожидают оплаты</p>
        </div>
      </section>

      <section className="panel section">
        <h2>Ближайший урок</h2>
        {nextLesson ? (
          <p>
            {nextLesson.startsAt.toLocaleString("ru-RU", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
            : {nextLesson.group?.name ?? nextLesson.course.name}, {nextLesson.teacher.name}.
          </p>
        ) : (
          <p>Ближайшие уроки пока не созданы.</p>
        )}
      </section>
    </>
  );
}
