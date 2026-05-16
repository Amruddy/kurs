import { requireWorkspace } from "@/app/lib/dev-auth";
import { prisma } from "@/app/lib/prisma";

function formatDateTime(date: Date) {
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
  const nextLesson = lessons[0] ?? null;
  const groupCount = new Set(lessons.map((lesson) => lesson.groupId).filter(Boolean)).size;
  const teacherCount = new Set(lessons.map((lesson) => lesson.group?.teacher?.id).filter(Boolean)).size;

  return (
    <>
      <div className="page-heading">
        <h1>Моё расписание</h1>
      </div>

      <section className="student-overview-grid">
        <div className="panel student-main-panel">
          <div className="section-heading">
            <div>
              <span className="status">Расписание</span>
              <h2>Ближайшие занятия</h2>
            </div>
          </div>
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
                      <td>{formatDateTime(lesson.startsAt)}</td>
                      <td>{lesson.group?.name ?? "Индивидуально"}</td>
                      <td>{lesson.group?.course.name ?? lesson.course.name}</td>
                      <td>{lesson.group?.teacher?.name ?? "Не назначен"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="panel student-side-panel">
          <span className="status">Ближайшее</span>
          <h2>Следующий урок</h2>
          {nextLesson ? (
            <div className="student-highlight compact">
              <strong>{formatDateTime(nextLesson.startsAt)}</strong>
              <p>
                {nextLesson.group?.name ?? "Индивидуально"} · {nextLesson.group?.course.name ?? nextLesson.course.name}
              </p>
            </div>
          ) : (
            <p>Уроков в расписании пока нет.</p>
          )}
        </aside>
      </section>

      <section className="metric-grid section" aria-label="Сводка расписания">
        <div className="panel metric-card">
          <span>Занятия</span>
          <strong>{lessons.length}</strong>
          <p>Ближайшие уроки</p>
        </div>
        <div className="panel metric-card">
          <span>Группы</span>
          <strong>{groupCount}</strong>
          <p>Активное обучение</p>
        </div>
        <div className="panel metric-card">
          <span>Преподаватели</span>
          <strong>{teacherCount}</strong>
          <p>Назначены в группах</p>
        </div>
        <div className="panel metric-card">
          <span>Следующий урок</span>
          <strong>{nextLesson ? "есть" : "нет"}</strong>
          <p>{nextLesson ? nextLesson.group?.name ?? nextLesson.course.name : "Ожидает расписания"}</p>
        </div>
      </section>
    </>
  );
}
