import { attendanceMarkLabels } from "@/app/lib/learning-labels";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { prisma } from "@/app/lib/prisma";
import { saveGroupJournal } from "@/app/teacher/actions";

type TeacherGroupJournalPageProps = {
  params: Promise<{ groupId: string }>;
};

function entryValue(entry: { mark: "present" | "absent" | "excused" | null; score: number | null } | undefined) {
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

function isWeekStart(index: number, lessonDate: Date, previousLessonDate?: Date) {
  if (index === 0) {
    return false;
  }

  if (!previousLessonDate) {
    return false;
  }

  return lessonDate.getDay() < previousLessonDate.getDay();
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
        <p>
          {group.course.name}
          {selectedMonthLabel ? `, ${selectedMonthLabel}` : ""}. В ячейку можно ввести оценку или статус: Б, Н, У.
        </p>
      </div>

      <form className="journal-sheet" action={saveGroupJournal.bind(null, group.id)}>
        <div className="section-heading">
          <div>
            <h2>Журнал</h2>
            <p>Оценка: число. Посещаемость: Б - был, Н - не был, У - уважительная причина.</p>
          </div>
          <button className="button compact-button" type="submit">
            Сохранить журнал
          </button>
        </div>

        {group.students.length === 0 || journalLessons.length === 0 ? (
          <p>Для журнала нужны активные ученики и созданные уроки.</p>
        ) : (
          <div className="journal-table-wrap">
            <table className="journal-table">
              <thead>
                <tr>
                  <th className="journal-student-head">Ученик</th>
                  {journalLessons.map((lesson, index) => (
                    <th
                      key={lesson.id}
                      className={isWeekStart(index, lesson.startsAt, journalLessons[index - 1]?.startsAt) ? "week-start" : ""}
                    >
                      <span>{lesson.startsAt.toLocaleDateString("ru-RU", { weekday: "short" })}</span>
                      <strong>{lesson.startsAt.toLocaleDateString("ru-RU", { day: "2-digit" })}</strong>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {group.students.map((link) => (
                  <tr key={link.id}>
                    <th className="journal-student-name" scope="row">
                      {link.student.name}
                    </th>
                    {journalLessons.map((lesson, index) => {
                      const entry = lesson.journalEntries.find((item) => item.studentId === link.studentId);

                      return (
                        <td
                          key={lesson.id}
                          className={isWeekStart(index, lesson.startsAt, journalLessons[index - 1]?.startsAt) ? "week-start" : ""}
                        >
                          <input
                            aria-label={`${link.student.name}, ${lesson.startsAt.toLocaleDateString("ru-RU")}`}
                            className="journal-cell-input"
                            name={`cell-${lesson.id}-${link.studentId}`}
                            defaultValue={entryValue(entry)}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </form>

      <section className="journal-meta section">
        <h2>Уроки</h2>
        <p>{journalLessons.length === 0 ? "Уроки пока не созданы." : `Уроков в месяце: ${journalLessons.length}.`}</p>
      </section>
    </>
  );
}
