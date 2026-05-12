import Link from "next/link";
import {
  attendanceMarkFullLabels,
  attendanceStatusLabels,
  lessonStatusLabels,
} from "@/app/lib/learning-labels";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { prisma } from "@/app/lib/prisma";
import { completeLesson, confirmAttendance, saveLessonJournal, startLesson } from "@/app/teacher/actions";

type TeacherLessonPageProps = {
  params: Promise<{ lessonId: string }>;
};

export default async function TeacherLessonPage({ params }: TeacherLessonPageProps) {
  const { lessonId } = await params;
  const session = await requireWorkspace("teacher");
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      organizationId: session.organizationId,
      teacherId: session.userId,
    },
    include: {
      course: true,
      group: {
        include: {
          students: {
            where: { status: "active" },
            include: { student: true },
            orderBy: { joinedAt: "asc" },
          },
        },
      },
      journalEntries: true,
    },
  });

  if (!lesson || !lesson.group) {
    return (
      <section className="panel">
        <h1>Урок не найден</h1>
        <p>Урок не существует или не назначен текущему преподавателю.</p>
      </section>
    );
  }

  const entriesByStudentId = new Map(lesson.journalEntries.map((entry) => [entry.studentId, entry]));
  const maxScore =
    lesson.course.lessonMarkScale === "five_point" ? 5 : lesson.course.lessonMarkScale === "ten_point" ? 10 : null;

  return (
    <>
      <div className="page-heading">
        <span className="status">{lessonStatusLabels[lesson.lessonStatus]}</span>
        <h1>{lesson.group.name}</h1>
        <p>
          {lesson.startsAt.toLocaleString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
          . Посещаемость: {attendanceStatusLabels[lesson.attendanceStatus]}.
        </p>
      </div>

      <section className="panel">
        <div className="button-row">
          <Link className="secondary-button link-button compact-button" href={`/teacher/groups/${lesson.group.id}/journal`}>
            Журнал группы
          </Link>
          <form action={startLesson.bind(null, lesson.id)}>
            <button className="secondary-button compact-button" type="submit" disabled={lesson.lessonStatus !== "scheduled"}>
              Начать урок
            </button>
          </form>
          <form action={confirmAttendance.bind(null, lesson.id)}>
            <button className="secondary-button compact-button" type="submit">
              Подтвердить посещаемость
            </button>
          </form>
          <form action={completeLesson.bind(null, lesson.id)}>
            <button className="button compact-button" type="submit">
              Завершить урок
            </button>
          </form>
        </div>
      </section>

      <form className="panel section" action={saveLessonJournal.bind(null, lesson.id)}>
        <h2>Запись урока</h2>
        <div className="form-grid">
          <label>
            Тема
            <input name="topic" defaultValue={lesson.topic ?? ""} placeholder="Тема урока" />
          </label>
          <label>
            Комментарий к уроку
            <input name="summary" defaultValue={lesson.summary ?? ""} placeholder="Короткий комментарий" />
          </label>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ученик</th>
                <th>Отметка</th>
                <th>Оценка</th>
                <th>Комментарий</th>
              </tr>
            </thead>
            <tbody>
              {lesson.group.students.map((link) => {
                const entry = entriesByStudentId.get(link.studentId);

                return (
                  <tr key={link.id}>
                    <td>{link.student.name}</td>
                    <td>
                      <select name={`mark-${link.studentId}`} defaultValue={entry?.mark ?? ""}>
                        <option value="">Пусто</option>
                        {Object.entries(attendanceMarkFullLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        name={`score-${link.studentId}`}
                        type="number"
                        min="1"
                        max={maxScore ?? undefined}
                        defaultValue={entry?.score ?? ""}
                        disabled={!maxScore}
                      />
                    </td>
                    <td>
                      <input name={`comment-${link.studentId}`} defaultValue={entry?.comment ?? ""} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <button className="button compact-button section" type="submit">
          Сохранить журнал
        </button>
      </form>
    </>
  );
}
