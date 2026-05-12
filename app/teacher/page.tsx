import Link from "next/link";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { groupStatusLabels, lessonStatusLabels } from "@/app/lib/learning-labels";
import { prisma } from "@/app/lib/prisma";

export default async function TeacherPage() {
  const session = await requireWorkspace("teacher");
  const [groups, nextLesson] = await Promise.all([
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
            lessonStatus: "scheduled",
            startsAt: { gte: new Date() },
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
        lessonStatus: "scheduled",
        startsAt: { gte: new Date() },
      },
      include: {
        group: true,
        course: true,
      },
      orderBy: { startsAt: "asc" },
    }),
  ]);

  return (
    <>
      <div className="page-heading">
        <span className="status">Преподаватель</span>
        <h1>Рабочая область преподавателя</h1>
        <p>
          Здесь показываются группы, назначенные текущему преподавателю. Журнал, расписание и уроки
          будут добавлены на следующих этапах.
        </p>
      </div>

      <section className="grid">
        <div className="panel">
          <h2>{session.name}</h2>
          <p>{session.email}</p>
        </div>
        <div className="panel">
          <h2>{groups.length}</h2>
          <p>Назначенных групп</p>
        </div>
        <div className="panel">
          <h2>{session.organizationName}</h2>
          <p>Организация</p>
        </div>
      </section>

      <section className="panel section">
        <h2>Ближайший урок</h2>
        {nextLesson ? (
          <div className="section-heading">
            <p>
              {nextLesson.startsAt.toLocaleString("ru-RU", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
              : {nextLesson.group?.name ?? nextLesson.course.name}, {lessonStatusLabels[nextLesson.lessonStatus]}.
            </p>
            <Link className="button link-button compact-button" href={`/teacher/lessons/${nextLesson.id}`}>
              Открыть урок
            </Link>
          </div>
        ) : (
          <p>Ближайшие уроки пока не созданы.</p>
        )}
      </section>

      <section className="panel section">
        <div className="section-heading">
          <h2>Мои группы</h2>
          <Link className="secondary-button link-button" href="/teacher/groups">
            Открыть список
          </Link>
          <Link className="secondary-button link-button" href="/teacher/attendance">
            Посещаемость
          </Link>
          <Link className="secondary-button link-button" href="/teacher/students">
            Ученики
          </Link>
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
                    <td>
                      {group.lessons[0]
                        ? group.lessons[0].startsAt.toLocaleString("ru-RU", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Нет"}
                    </td>
                    <td>{groupStatusLabels[group.status]}</td>
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
