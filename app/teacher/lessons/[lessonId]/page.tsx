import Link from "next/link";
import { lessonStatusLabels, materialTypeLabels } from "@/app/lib/learning-labels";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { prisma } from "@/app/lib/prisma";
import {
  completeLesson,
  createLessonHomework,
  createLessonMaterial,
  createLessonProgress,
  saveLessonDetails,
  startLesson,
} from "@/app/teacher/actions";

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
      group: {
        include: {
          students: {
            where: { status: "active" },
            include: { student: true },
            orderBy: { joinedAt: "asc" },
          },
        },
      },
      homeworks: {
        where: { status: "active" },
        include: { student: true },
        orderBy: { createdAt: "desc" },
      },
      materials: {
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
      },
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
          . Посещаемость редактируется в журнале группы.
        </p>
      </div>

      <section className="panel">
        <div className="button-row">
          <Link className="button link-button compact-button" href={`/teacher/groups/${lesson.group.id}/journal`}>
            Открыть журнал
          </Link>
          <form action={startLesson.bind(null, lesson.id)}>
            <button className="secondary-button compact-button" type="submit" disabled={lesson.lessonStatus !== "scheduled"}>
              Начать урок
            </button>
          </form>
          <form action={completeLesson.bind(null, lesson.id)}>
            <button className="button compact-button" type="submit">
              Завершить урок
            </button>
          </form>
        </div>
      </section>

      <form className="panel section" action={saveLessonDetails.bind(null, lesson.id)}>
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
        <button className="button compact-button section" type="submit">
          Сохранить запись
        </button>
      </form>

      <section className="lesson-workspace-grid section">
        <form className="panel lesson-workspace-card" action={createLessonProgress.bind(null, lesson.id)}>
          <h2>Прогресс</h2>
          <div className="form-grid">
            <label>
              Ученик
              <select name="studentId" required>
                <option value="">Выберите</option>
                {lesson.group.students.map((link) => (
                  <option key={link.studentId} value={link.studentId}>
                    {link.student.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Повторить
              <input name="repeatText" placeholder="Например: мадды" />
            </label>
            <label>
              Комментарий для ученика
              <input name="studentComment" />
            </label>
            <label>
              Внутренний комментарий
              <input name="internalComment" />
            </label>
            <label className="checkbox-label">
              <input name="showRules" type="checkbox" defaultChecked /> Показать правила
            </label>
            <label className="checkbox-label">
              <input name="showErrors" type="checkbox" defaultChecked /> Показать ошибки
            </label>
            <label className="checkbox-label">
              <input name="showRepeatText" type="checkbox" defaultChecked /> Показать повтор
            </label>
            <label className="checkbox-label">
              <input name="showStudentComment" type="checkbox" defaultChecked /> Показать комментарий
            </label>
          </div>
          <button className="button compact-button section" type="submit">
            Добавить прогресс
          </button>
        </form>

        <form className="panel lesson-workspace-card" action={createLessonHomework.bind(null, lesson.id)}>
          <h2>Домашнее задание</h2>
          <div className="form-grid">
            <label>
              Название
              <input name="title" required />
            </label>
            <label>
              Срок
              <input name="dueAt" type="date" />
            </label>
            <label>
              Ученик
              <select name="studentId">
                <option value="">Вся группа</option>
                {lesson.group.students.map((link) => (
                  <option key={link.studentId} value={link.studentId}>
                    {link.student.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Текст
              <input name="text" required />
            </label>
            <label className="checkbox-label">
              <input name="isVisibleToStudent" type="checkbox" defaultChecked /> Видно ученику
            </label>
          </div>
          <button className="button compact-button section" type="submit">
            Задать
          </button>
        </form>
      </section>

      <section className="lesson-workspace-grid section">
        <form className="panel lesson-workspace-card" action={createLessonMaterial.bind(null, lesson.id)}>
          <h2>Материал</h2>
          <div className="form-grid">
            <label>
              Текст или ссылка
              <input name="material" required placeholder="Вставьте ссылку или короткий текст" />
            </label>
            <label className="checkbox-label">
              <input name="isVisibleToStudent" type="checkbox" defaultChecked /> Видно ученику
            </label>
          </div>
          <button className="button compact-button section" type="submit">
            Добавить материал
          </button>
        </form>

        <div className="panel lesson-workspace-card">
          <h2>Уже добавлено</h2>
          {lesson.homeworks.length === 0 && lesson.materials.length === 0 ? (
            <p>Домашних заданий и материалов пока нет.</p>
          ) : (
            <ul className="muted-list">
              {lesson.homeworks.map((homework) => (
                <li key={homework.id}>
                  ДЗ: {homework.title}
                  {homework.student ? ` (${homework.student.name})` : ""}
                </li>
              ))}
              {lesson.materials.map((material) => (
                <li key={material.id}>
                  {materialTypeLabels[material.type]}: {material.title}
                  {material.isVisibleToStudent ? "" : " (скрыто)"}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
