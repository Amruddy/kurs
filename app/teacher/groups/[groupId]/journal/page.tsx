import Link from "next/link";
import { attendanceMarkLabels, attendanceStatusLabels, lessonStatusLabels } from "@/app/lib/learning-labels";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { prisma } from "@/app/lib/prisma";

type TeacherGroupJournalPageProps = {
  params: Promise<{ groupId: string }>;
};

function entryLabel(entry: { mark: "present" | "absent" | "excused" | null; score: number | null } | undefined) {
  if (!entry) {
    return "";
  }

  if (entry.score) {
    return String(entry.score);
  }

  return entry.mark ? attendanceMarkLabels[entry.mark] : "";
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function monthLabel(date: Date) {
  return date.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
}

export default async function TeacherGroupJournalPage({ params }: TeacherGroupJournalPageProps) {
  const { groupId } = await params;
  const session = await requireWorkspace("teacher");
  const group = await prisma.group.findFirst({
    where: {
      id: groupId,
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
          lessonStatus: { notIn: ["cancelled", "moved"] },
        },
        include: {
          journalEntries: true,
        },
        orderBy: { startsAt: "asc" },
      },
    },
  });

  if (!group) {
    return (
      <section className="panel">
        <h1>Журнал не найден</h1>
        <p>Группа не существует или не назначена текущему преподавателю.</p>
      </section>
    );
  }

  const firstLesson = group.lessons[0];
  const selectedMonthKey = firstLesson ? monthKey(firstLesson.startsAt) : null;
  const journalLessons = selectedMonthKey
    ? group.lessons.filter((lesson) => monthKey(lesson.startsAt) === selectedMonthKey)
    : [];
  const selectedMonthLabel = firstLesson ? monthLabel(firstLesson.startsAt) : null;

  return (
    <>
      <div className="page-heading">
        <span className="status">Журнал</span>
        <h1>{group.name}</h1>
        <p>{group.course.name}{selectedMonthLabel ? `, ${selectedMonthLabel}` : ""}.</p>
      </div>

      <section className="panel">
        <div className="button-row">
          <Link className="secondary-button link-button compact-button" href={`/teacher/groups/${group.id}`}>
            Группа
          </Link>
        </div>
      </section>

      <section className="panel section">
        <h2>Журнал</h2>
        {group.students.length === 0 || journalLessons.length === 0 ? (
          <p>Для журнала нужны активные ученики и созданные уроки.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ученик</th>
                  {journalLessons.map((lesson) => (
                    <th key={lesson.id}>
                      <Link href={`/teacher/lessons/${lesson.id}`} title="Открыть урок">
                        <span>{lesson.startsAt.toLocaleDateString("ru-RU", { weekday: "short" })}</span>
                        <strong>
                          {lesson.startsAt.toLocaleDateString("ru-RU", { day: "2-digit" })}
                        </strong>
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {group.students.map((link) => (
                  <tr key={link.id}>
                    <td>{link.student.name}</td>
                    {journalLessons.map((lesson) => {
                      const entry = lesson.journalEntries.find((item) => item.studentId === link.studentId);

                      return <td key={lesson.id}>{entryLabel(entry)}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel section">
        <h2>Уроки</h2>
        {journalLessons.length === 0 ? (
          <p>Уроки пока не созданы.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Статус</th>
                  <th>Посещаемость</th>
                  <th>Действие</th>
                </tr>
              </thead>
              <tbody>
                {journalLessons.map((lesson) => (
                  <tr key={lesson.id}>
                    <td>
                      {lesson.startsAt.toLocaleString("ru-RU", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td>{lessonStatusLabels[lesson.lessonStatus]}</td>
                    <td>{attendanceStatusLabels[lesson.attendanceStatus]}</td>
                    <td>
                      <Link className="secondary-button link-button compact-button" href={`/teacher/lessons/${lesson.id}`}>
                        Открыть
                      </Link>
                    </td>
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
