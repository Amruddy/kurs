import Link from "next/link";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { prisma } from "@/app/lib/prisma";

export default async function StudentPage() {
  const session = await requireWorkspace("student");
  const now = new Date();
  const student = await prisma.student.findFirst({
    where: {
      organizationId: session.organizationId,
      userId: session.userId,
    },
    include: {
      groupLinks: {
        where: { status: "active" },
        include: {
          group: {
            include: {
              course: true,
              teacher: true,
            },
          },
        },
      },
    },
  });
  const groupIds = student?.groupLinks.map((link) => link.groupId) ?? [];
  const nextLesson = student
    ? await prisma.lesson.findFirst({
        where: {
          organizationId: session.organizationId,
          groupId: { in: groupIds },
          startsAt: { gte: now },
        },
        include: { group: { include: { course: true, teacher: true } }, course: true },
        orderBy: { startsAt: "asc" },
      })
    : null;

  return (
    <>
      <div className="page-heading page-heading-with-action student-heading">
        <div>
          <span className="status">Ученик</span>
          <h1>Кабинет ученика</h1>
          <p>Ближайший урок, домашнее задание, материалы, оценки, посещаемость и открытый прогресс.</p>
        </div>
        <details className="student-menu">
          <summary aria-label="Разделы">
            <span className="hamburger-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </summary>
          <div className="student-dashboard-links">
            <Link className="secondary-button link-button" href="/student/schedule">
              Расписание
            </Link>
            <Link className="secondary-button link-button" href="/student/homework">
              Домашнее задание
            </Link>
            <Link className="secondary-button link-button" href="/student/materials">
              Материалы
            </Link>
            <Link className="secondary-button link-button" href="/student/progress">
              Прогресс
            </Link>
            <Link className="secondary-button link-button" href="/student/attendance">
              Оценки и посещаемость
            </Link>
          </div>
        </details>
      </div>

      <section className="panel student-next-lesson">
        <div>
          <h2>Ближайший урок</h2>
          {nextLesson ? (
            <p>
              {nextLesson.startsAt.toLocaleString("ru-RU", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
              : {nextLesson.group?.name ?? nextLesson.course.name}, {nextLesson.group?.course.name ?? nextLesson.course.name}.
            </p>
          ) : (
            <p>Ближайший урок пока не создан.</p>
          )}
        </div>
        <Link className="button link-button compact-button" href="/student/schedule">
          Расписание
        </Link>
      </section>

      <section className="student-tabs section" aria-label="Разделы ученика">
        <Link className="student-tab" href="/student/homework">
          Домашние задания
        </Link>
        <Link className="student-tab" href="/student/materials">
          Материалы
        </Link>
        <Link className="student-tab" href="/student/progress">
          Прогресс
        </Link>
        <Link className="student-tab" href="/student/attendance">
          Оценки и посещаемость
        </Link>
      </section>

      <section className="panel section" id="student-groups">
        <h2>Мои группы</h2>
        {!student || student.groupLinks.length === 0 ? (
          <p>Учебные группы пока не назначены.</p>
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
                    <td>{link.group.name}</td>
                    <td>{link.group.course.name}</td>
                    <td>{link.group.teacher?.name ?? "Не назначен"}</td>
                    <td>Активная</td>
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
