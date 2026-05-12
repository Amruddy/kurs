import { requireWorkspace } from "@/app/lib/dev-auth";
import { prisma } from "@/app/lib/prisma";

export default async function StudentSchedulePage() {
  const session = await requireWorkspace("student");
  const student = await prisma.student.findFirst({
    where: { organizationId: session.organizationId, userId: session.userId },
    include: { groupLinks: { where: { status: "active" } } },
  });
  const groupIds = student?.groupLinks.map((link) => link.groupId) ?? [];
  const lessons = student
    ? await prisma.lesson.findMany({
        where: {
          organizationId: session.organizationId,
          groupId: { in: groupIds },
          startsAt: { gte: new Date() },
        },
        include: {
          group: { include: { course: true, teacher: true } },
          course: true,
        },
        orderBy: { startsAt: "asc" },
        take: 20,
      })
    : [];

  return (
    <>
      <div className="page-heading">
        <span className="status">Расписание</span>
        <h1>Моё расписание</h1>
        <p>Ближайшие занятия по активным группам ученика.</p>
      </div>

      <section className="panel">
        {lessons.length === 0 ? (
          <p>Ближайшие уроки пока не созданы.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Группа</th>
                  <th>Курс</th>
                  <th>Преподаватель</th>
                </tr>
              </thead>
              <tbody>
                {lessons.map((lesson) => (
                  <tr key={lesson.id}>
                    <td>
                      {lesson.startsAt.toLocaleString("ru-RU", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td>{lesson.group?.name ?? "Индивидуально"}</td>
                    <td>{lesson.group?.course.name ?? lesson.course.name}</td>
                    <td>{lesson.group?.teacher?.name ?? "Не назначен"}</td>
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
