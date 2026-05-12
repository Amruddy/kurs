import { requireWorkspace } from "@/app/lib/dev-auth";
import { attendanceMarkFullLabels } from "@/app/lib/learning-labels";
import { prisma } from "@/app/lib/prisma";

function scoreText(score: number | null | undefined) {
  return score === null || score === undefined ? "Нет оценки" : String(score);
}

export default async function StudentAttendancePage() {
  const session = await requireWorkspace("student");
  const now = new Date();
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
          startsAt: { lt: now },
        },
        include: {
          group: { include: { course: true, teacher: true } },
          course: true,
          journalEntries: { where: { studentId: student.id } },
        },
        orderBy: { startsAt: "desc" },
        take: 30,
      })
    : [];

  const absent = lessons.filter((lesson) => lesson.journalEntries[0]?.mark === "absent").length;
  const excused = lessons.filter((lesson) => lesson.journalEntries[0]?.mark === "excused").length;
  const present = Math.max(lessons.length - absent - excused, 0);
  const scored = lessons.filter(
    (lesson) => lesson.journalEntries[0]?.score !== null && lesson.journalEntries[0]?.score !== undefined,
  ).length;

  return (
    <>
      <div className="page-heading">
        <span className="status">Ученик</span>
        <h1>Оценки и посещаемость</h1>
        <p>Последние занятия. Пустая отметка в прошедшем уроке считается присутствием.</p>
      </div>

      <section className="grid">
        <div className="panel">
          <h2>{lessons.length}</h2>
          <p>Завершённых уроков</p>
        </div>
        <div className="panel">
          <h2>{present}</h2>
          <p>Присутствий</p>
        </div>
        <div className="panel">
          <h2>{absent}</h2>
          <p>Пропусков</p>
        </div>
        <div className="panel">
          <h2>{scored}</h2>
          <p>Оценок</p>
        </div>
      </section>

      <section className="panel section">
        {lessons.length === 0 ? (
          <p>Прошедших занятий пока нет.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Группа</th>
                  <th>Курс</th>
                  <th>Отметка</th>
                  <th>Оценка</th>
                </tr>
              </thead>
              <tbody>
                {lessons.map((lesson) => {
                  const entry = lesson.journalEntries[0];
                  return (
                    <tr key={lesson.id}>
                      <td>
                        {lesson.startsAt.toLocaleString("ru-RU", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td>{lesson.group?.name ?? "Индивидуально"}</td>
                      <td>{lesson.group?.course.name ?? lesson.course.name}</td>
                      <td>{entry?.mark ? attendanceMarkFullLabels[entry.mark] : "Присутствовал"}</td>
                      <td>{scoreText(entry?.score)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
