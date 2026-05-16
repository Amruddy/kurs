import { requireWorkspace } from "@/app/lib/dev-auth";
import { attendanceMarkFullLabels } from "@/app/lib/learning-labels";
import { prisma } from "@/app/lib/prisma";

function scoreText(score: number | null | undefined) {
  return score === null || score === undefined ? "Нет оценки" : String(score);
}

function formatDateTime(date: Date) {
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
  const percent = lessons.length > 0 ? Math.round((present / lessons.length) * 100) : 0;
  const latestLesson = lessons[0] ?? null;

  return (
    <>
      <div className="page-heading">
        <h1>Оценки и посещаемость</h1>
      </div>

      <section className="metric-grid" aria-label="Сводка посещаемости ученика">
        <div className="panel metric-card">
          <span>Уроки</span>
          <strong>{lessons.length}</strong>
          <p>Последние занятия</p>
        </div>
        <div className="panel metric-card">
          <span>Посещаемость</span>
          <strong>{lessons.length > 0 ? `${percent}%` : "0%"}</strong>
          <p>Присутствий: {present}</p>
        </div>
        <div className="panel metric-card">
          <span>Пропуски</span>
          <strong>{absent}</strong>
          <p>Отметки Н</p>
        </div>
        <div className="panel metric-card">
          <span>Оценки</span>
          <strong>{scored}</strong>
          <p>Уроки с оценкой</p>
        </div>
      </section>

      <section className="student-overview-grid section">
        <div className="panel student-main-panel">
          <div className="section-heading">
            <div>
              <span className="status">История</span>
              <h2>Последние занятия</h2>
            </div>
          </div>
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
                        <td>{formatDateTime(lesson.startsAt)}</td>
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
        </div>

        <aside className="panel student-side-panel">
          <span className="status">Последнее</span>
          <h2>Недавний урок</h2>
          {latestLesson ? (
            <div className="student-list">
              <article className="student-list-item compact">
                <strong>{formatDateTime(latestLesson.startsAt)}</strong>
                <p>{latestLesson.group?.name ?? "Индивидуально"}</p>
                <span>
                  {latestLesson.journalEntries[0]?.mark
                    ? attendanceMarkFullLabels[latestLesson.journalEntries[0].mark]
                    : "Присутствовал"}
                </span>
              </article>
            </div>
          ) : (
            <p>Истории занятий пока нет.</p>
          )}
        </aside>
      </section>
    </>
  );
}
