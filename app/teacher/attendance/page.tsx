import Link from "next/link";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { prisma } from "@/app/lib/prisma";

function monthStart(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function nextMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
}

export default async function TeacherAttendancePage() {
  const session = await requireWorkspace("teacher");
  const now = new Date();
  const from = monthStart(now);
  const to = nextMonth(now);
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
          lessonStatus: "completed",
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

      return {
        student: link.student,
        group,
        expected,
        present,
        absent,
        excused,
        percent,
      };
    }),
  );

  return (
    <>
      <div className="page-heading">
        <span className="status">Посещаемость</span>
        <h1>Сводная посещаемость</h1>
        <p>Текущий месяц. Учитываются завершенные уроки.</p>
      </div>

      <section className="panel">
        {rows.length === 0 ? (
          <p>Пока нет данных для сводки.</p>
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
