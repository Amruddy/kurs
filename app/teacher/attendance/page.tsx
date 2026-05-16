import Link from "next/link";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { prisma } from "@/app/lib/prisma";

function monthStart(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function formatDate(date: Date) {
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function TeacherAttendancePage() {
  const session = await requireWorkspace("teacher");
  const now = new Date();
  const from = monthStart(now);
  const to = now;
  const groups = await prisma.group.findMany({
    where: {
      organizationId: session.organizationId,
      teacherId: session.userId,
      status: { not: "archived" },
    },
    include: {
      course: true,
      students: {
        where: { status: "active" },
        include: { student: true },
        orderBy: { joinedAt: "asc" },
      },
      lessons: {
        where: {
          startsAt: { gte: from, lt: to },
        },
        include: { journalEntries: true },
        orderBy: { startsAt: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const rows = groups.flatMap((group) =>
    group.students.map((link) => {
      const expected = group.lessons.length;
      const entries = group.lessons
        .map((lesson) => lesson.journalEntries.find((entry) => entry.studentId === link.studentId))
        .filter(Boolean);
      const absent = entries.filter((entry) => entry?.mark === "absent").length;
      const excused = entries.filter((entry) => entry?.mark === "excused").length;
      const present = Math.max(expected - absent - excused, 0);
      const percent = expected > 0 ? Math.round((present / expected) * 100) : 0;
      const lastLesson = group.lessons.at(-1) ?? null;
      const statusText =
        expected === 0 ? "нет данных" : absent >= 3 ? "частые пропуски" : absent > 0 ? "есть пропуски" : "100%";

      return {
        student: link.student,
        group,
        expected,
        present,
        absent,
        excused,
        percent,
        lastLesson,
        statusText,
      };
    }),
  );
  const totalExpected = rows.reduce((sum, row) => sum + row.expected, 0);
  const totalPresent = rows.reduce((sum, row) => sum + row.present, 0);
  const totalAbsent = rows.reduce((sum, row) => sum + row.absent, 0);
  const lowAttendanceCount = rows.filter((row) => row.expected > 0 && row.percent < 80).length;
  const overallPercent = totalExpected > 0 ? Math.round((totalPresent / totalExpected) * 100) : 0;

  return (
    <>
      <div className="page-heading">
        <h1>Сводная посещаемость</h1>
      </div>

      <section className="metric-grid" aria-label="Сводка посещаемости">
        <div className="panel metric-card">
          <span>Ученики</span>
          <strong>{rows.length}</strong>
          <p>В активных группах</p>
        </div>
        <div className="panel metric-card">
          <span>Посещаемость</span>
          <strong>{totalExpected > 0 ? `${overallPercent}%` : "0%"}</strong>
          <p>За текущий месяц</p>
        </div>
        <div className="panel metric-card">
          <span>Пропуски</span>
          <strong>{totalAbsent}</strong>
          <p>Отметки Н</p>
        </div>
        <div className="panel metric-card">
          <span>Риск</span>
          <strong>{lowAttendanceCount}</strong>
          <p>Ниже 80%</p>
        </div>
      </section>

      <section className="teacher-overview-grid section">
        <div className="panel teacher-main-panel">
          <div className="section-heading">
            <div>
              <span className="status">Текущий месяц</span>
              <h2>Ученики и пропуски</h2>
            </div>
          </div>

          {rows.length === 0 ? (
            <p className="empty-state">Пока нет данных для сводки.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Ученик</th>
                    <th>Группа</th>
                    <th>Уроков</th>
                    <th>Был</th>
                    <th>Пропуск</th>
                    <th>Уваж.</th>
                    <th>%</th>
                    <th>Последний урок</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={`${row.group.id}-${row.student.id}`}>
                      <td>
                        <Link href={`/teacher/students/${row.student.id}`}>{row.student.name}</Link>
                      </td>
                      <td>
                        <Link href={`/teacher/groups/${row.group.id}/journal`}>{row.group.name}</Link>
                      </td>
                      <td>{row.expected}</td>
                      <td>{row.present}</td>
                      <td>{row.absent}</td>
                      <td>{row.excused}</td>
                      <td>{row.expected > 0 ? `${row.percent}%` : "Нет уроков"}</td>
                      <td>
                        {row.lastLesson ? (
                          <Link href={`/teacher/lessons/${row.lastLesson.id}`}>{formatDate(row.lastLesson.startsAt)}</Link>
                        ) : (
                          "Нет"
                        )}
                      </td>
                      <td>{row.statusText}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="panel teacher-side-panel">
          <span className="status">Фокус</span>
          <h2>Что важно</h2>
          <div className="signal-list">
            <div className="signal-item" data-tone={lowAttendanceCount > 0 ? "warning" : "ok"}>
              <strong>{lowAttendanceCount}</strong>
              <div>
                <span>Низкая посещаемость</span>
                <p>{lowAttendanceCount > 0 ? "Есть ученики ниже 80%." : "Критичных просадок нет."}</p>
              </div>
            </div>
            <div className="signal-item" data-tone={totalAbsent > 0 ? "warning" : "ok"}>
              <strong>{totalAbsent}</strong>
              <div>
                <span>Пропуски</span>
                <p>{totalAbsent > 0 ? "Проверьте строки с отметками Н." : "Пропусков за месяц нет."}</p>
              </div>
            </div>
            <div className="signal-item" data-tone="ok">
              <strong>{groups.length}</strong>
              <div>
                <span>Группы</span>
                <p>В сводке участвуют активные группы преподавателя.</p>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </>
  );
}
