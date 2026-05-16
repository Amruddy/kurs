import Link from "next/link";
import { materialTypeLabels } from "@/app/lib/learning-labels";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { prisma } from "@/app/lib/prisma";
import {
  createLessonHomework,
  createLessonMaterial,
  createLessonProgress,
  saveLessonDetails,
} from "@/app/teacher/actions";

type TeacherLessonPageProps = {
  params: Promise<{ lessonId: string }>;
};

function formatDateTime(date: Date) {
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
      progressRecords: true,
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
        <h1>{lesson.group.name}</h1>
      </div>

      <section className="teacher-overview-grid">
        <form className="panel teacher-main-panel" action={saveLessonDetails.bind(null, lesson.id)}>
          <span className="status">Запись урока</span>
          <h2>{formatDateTime(lesson.startsAt)}</h2>
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
          <button className="button compact-button" type="submit">
            Сохранить запись
          </button>
        </form>

        <aside className="panel teacher-side-panel">
          <span className="status">Урок</span>
          <h2>Контекст</h2>
          <div className="teacher-list">
            <div className="teacher-list-item">
              <strong>{lesson.course.name}</strong>
              <span>Курс</span>
            </div>
            <div className="teacher-list-item">
              <Link href={`/teacher/groups/${lesson.group.id}`}>{lesson.group.name}</Link>
              <span>Группа</span>
            </div>
            <div className="teacher-list-item">
              <Link href={`/teacher/groups/${lesson.group.id}/journal`}>Открыть журнал</Link>
              <span>Посещаемость редактируется в журнале группы</span>
            </div>
          </div>
        </aside>
      </section>

      <section className="metric-grid section" aria-label="Сводка урока">
        <div className="panel metric-card">
          <span>Ученики</span>
          <strong>{lesson.group.students.length}</strong>
          <p>В активном составе</p>
        </div>
        <div className="panel metric-card">
          <span>Журнал</span>
          <strong>{lesson.journalEntries.length}</strong>
          <p>Заполненные записи</p>
        </div>
        <div className="panel metric-card">
          <span>ДЗ</span>
          <strong>{lesson.homeworks.length}</strong>
          <p>Активные задания</p>
        </div>
        <div className="panel metric-card">
          <span>Материалы</span>
          <strong>{lesson.materials.length}</strong>
          <p>Тексты и ссылки</p>
        </div>
      </section>

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
