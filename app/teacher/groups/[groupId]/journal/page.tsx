import Link from "next/link";
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

function formatDateTime(date: Date) {
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
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
  const filledEntriesCount = journalLessons.reduce(
    (sum, lesson) =>
      sum +
      lesson.journalEntries.filter((entry) => entry.mark !== null || entry.score !== null || Boolean(entry.comment)).length,
    0,
  );
  const absentEntriesCount = journalLessons.reduce(
    (sum, lesson) => sum + lesson.journalEntries.filter((entry) => entry.mark === "absent").length,
    0,
  );

  return (
    <>
      <div className="page-heading">
        <h1>{group.name}</h1>
      </div>

      <section className="teacher-overview-grid">
        <div className="panel teacher-main-panel">
          <span className="status">Журнал</span>
          <h2>{selectedMonthLabel ?? "Месяц не выбран"}</h2>
          <p>{group.course.name}. В таблице показаны только даты, когда есть занятия.</p>
          <div className="button-row">
            <Link className="secondary-button link-button compact-button" href={`/teacher/groups/${group.id}`}>
              Открыть группу
            </Link>
            <Link className="secondary-button link-button compact-button" href="/teacher/attendance">
              Сводная посещаемость
            </Link>
          </div>
        </div>

        <aside className="panel teacher-side-panel">
          <span className="status">Обозначения</span>
          <h2>Как читать ячейки</h2>
          <div className="teacher-list">
            <div className="teacher-list-item">
              <strong>П</strong>
              <span>присутствовал</span>
            </div>
            <div className="teacher-list-item">
              <strong>Н</strong>
              <span>отсутствовал</span>
            </div>
            <div className="teacher-list-item">
              <strong>У</strong>
              <span>уважительная причина</span>
            </div>
            <div className="teacher-list-item">
              <strong>число</strong>
              <span>оценка за урок</span>
            </div>
          </div>
        </aside>
      </section>

      <section className="metric-grid section" aria-label="Сводка журнала">
        <div className="panel metric-card">
          <span>Ученики</span>
          <strong>{group.students.length}</strong>
          <p>Активный состав</p>
        </div>
        <div className="panel metric-card">
          <span>Уроки</span>
          <strong>{journalLessons.length}</strong>
          <p>{selectedMonthLabel ?? "Нет выбранного месяца"}</p>
        </div>
        <div className="panel metric-card">
          <span>Записи</span>
          <strong>{filledEntriesCount}</strong>
          <p>Заполненные ячейки</p>
        </div>
        <div className="panel metric-card">
          <span>Пропуски</span>
          <strong>{absentEntriesCount}</strong>
          <p>Отметки Н</p>
        </div>
      </section>

      <form className="journal-sheet section" action={saveGroupJournal.bind(null, group.id)}>
        <div className="section-heading">
          <div>
            <h2>Журнал</h2>
            <p>Оценка: число. Посещаемость: П - был, Н - не был, У - уважительная причина.</p>
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

      <section className="panel section">
        <div className="section-heading">
          <div>
            <span className="status">Уроки</span>
            <h2>Даты месяца</h2>
          </div>
        </div>
        {journalLessons.length === 0 ? (
          <p>Уроки пока не созданы.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Тема</th>
                  <th>Действие</th>
                </tr>
              </thead>
              <tbody>
                {journalLessons.map((lesson) => (
                  <tr key={lesson.id}>
                    <td>{formatDateTime(lesson.startsAt)}</td>
                    <td>{lesson.topic || "Тема еще не указана"}</td>
                    <td>
                      <Link className="secondary-button link-button compact-button" href={`/teacher/lessons/${lesson.id}`}>
                        Открыть урок
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
