import Link from "next/link";
import {
  attendanceMarkFullLabels,
  lessonStatusLabels,
  progressLevelLabels,
} from "@/app/lib/learning-labels";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { prisma } from "@/app/lib/prisma";
import { createProgressError, createProgressRecord, createProgressRule } from "@/app/teacher/actions";

type TeacherStudentPageProps = {
  params: Promise<{ studentId: string }>;
};

function markText(entry: { mark: "present" | "absent" | "excused" | null; score: number | null } | null) {
  if (!entry) {
    return "Пусто";
  }

  const parts = [];

  if (entry.mark) {
    parts.push(attendanceMarkFullLabels[entry.mark]);
  }

  if (entry.score) {
    parts.push(`оценка ${entry.score}`);
  }

  return parts.join(", ") || "Пусто";
}

export default async function TeacherStudentPage({ params }: TeacherStudentPageProps) {
  const { studentId } = await params;
  const session = await requireWorkspace("teacher");
  const links = await prisma.groupStudent.findMany({
    where: {
      studentId,
      status: "active",
      group: {
        organizationId: session.organizationId,
        teacherId: session.userId,
        status: { not: "archived" },
      },
    },
    include: {
      student: true,
      group: {
        include: { course: true },
      },
    },
  });

  if (links.length === 0) {
    return (
      <section className="panel">
        <h1>Ученик не найден</h1>
        <p>Ученик не входит в ваши активные группы.</p>
      </section>
    );
  }

  const student = links[0].student;
  const groupIds = links.map((link) => link.groupId);
  const lessons = await prisma.lesson.findMany({
    where: {
      organizationId: session.organizationId,
      teacherId: session.userId,
      groupId: { in: groupIds },
      lessonStatus: "completed",
    },
    include: {
      group: true,
      journalEntries: {
        where: { studentId: student.id },
      },
    },
    orderBy: { startsAt: "desc" },
    take: 20,
  });
  const [rules, errors, progressRecords, homeworks, materials] = await Promise.all([
    prisma.studentProgressRule.findMany({
      where: { organizationId: session.organizationId, studentId: student.id, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    prisma.studentProgressError.findMany({
      where: { organizationId: session.organizationId, studentId: student.id, isActive: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.progressRecord.findMany({
      where: { organizationId: session.organizationId, studentId: student.id },
      include: { lesson: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.homework.findMany({
      where: {
        organizationId: session.organizationId,
        status: "active",
        OR: [{ studentId: student.id }, { groupId: { in: groupIds }, studentId: null }],
      },
      include: { group: true, lesson: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.material.findMany({
      where: {
        organizationId: session.organizationId,
        status: "active",
        OR: [{ studentId: student.id }, { groupId: { in: groupIds } }, { lesson: { groupId: { in: groupIds } } }],
      },
      include: { group: true, lesson: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <>
      <div className="page-heading">
        <span className="status">Ученик</span>
        <h1>{student.name}</h1>
        <p>{[student.phone, student.email].filter(Boolean).join(", ") || "Контакты не указаны"}.</p>
      </div>

      <section className="panel">
        <h2>Группы</h2>
        <div className="button-row">
          {links.map((link) => (
            <Link key={link.id} className="secondary-button link-button compact-button" href={`/teacher/groups/${link.group.id}`}>
              {link.group.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="grid section">
        <form className="panel" action={createProgressRule.bind(null, student.id)}>
          <h2>Правило таджвида</h2>
          <div className="form-grid">
            <label>
              Правило
              <input name="name" required />
            </label>
            <label>
              Уровень
              <select name="level">
                <option value="">Без уровня</option>
                {Object.entries(progressLevelLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Заметка
              <input name="note" />
            </label>
            <label className="checkbox-label">
              <input name="isVisibleToStudent" type="checkbox" defaultChecked /> Видно ученику
            </label>
          </div>
          <button className="button compact-button section" type="submit">
            Добавить правило
          </button>
        </form>

        <form className="panel" action={createProgressError.bind(null, student.id)}>
          <h2>Ошибка чтения</h2>
          <div className="form-grid">
            <label>
              Ошибка
              <input name="name" required />
            </label>
            <label>
              Заметка
              <input name="note" />
            </label>
            <label className="checkbox-label">
              <input name="isRepeated" type="checkbox" /> Повторяется
            </label>
            <label className="checkbox-label">
              <input name="isVisibleToStudent" type="checkbox" defaultChecked /> Видно ученику
            </label>
          </div>
          <button className="button compact-button section" type="submit">
            Добавить ошибку
          </button>
        </form>
      </section>

      <form className="panel section" action={createProgressRecord.bind(null, student.id, null)}>
        <h2>Запись прогресса</h2>
        <div className="form-grid">
          <label>
            Повторить
            <input name="repeatText" />
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
          Сохранить прогресс
        </button>
      </form>

      <section className="grid section">
        <div className="panel">
          <h2>Правила</h2>
          {rules.length === 0 ? (
            <p>Правила пока не добавлены.</p>
          ) : (
            <ul className="muted-list">
              {rules.map((rule) => (
                <li key={rule.id}>
                  {rule.name}
                  {rule.level ? `: ${progressLevelLabels[rule.level]}` : ""}
                  {rule.isVisibleToStudent ? "" : " (скрыто)"}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="panel">
          <h2>Ошибки</h2>
          {errors.length === 0 ? (
            <p>Ошибки пока не зафиксированы.</p>
          ) : (
            <ul className="muted-list">
              {errors.map((error) => (
                <li key={error.id}>
                  {error.name}
                  {error.isRepeated ? " (повторяется)" : ""}
                  {error.isVisibleToStudent ? "" : " (скрыто)"}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="grid section">
        <div className="panel">
          <h2>Прогресс</h2>
          {progressRecords.length === 0 ? (
            <p>Записей прогресса пока нет.</p>
          ) : (
            <ul className="muted-list">
              {progressRecords.map((record) => (
                <li key={record.id}>
                  {record.createdAt.toLocaleDateString("ru-RU")}: {record.repeatText || record.studentComment || "Запись"}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="panel">
          <h2>ДЗ и материалы</h2>
          <p>Домашних заданий: {homeworks.length}. Материалов: {materials.length}.</p>
        </div>
      </section>

      <section className="panel section">
        <h2>История посещаемости</h2>
        {lessons.length === 0 ? (
          <p>Подтвержденной посещаемости пока нет.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Группа</th>
                  <th>Урок</th>
                  <th>Посещаемость</th>
                  <th>Статус урока</th>
                </tr>
              </thead>
              <tbody>
                {lessons.map((lesson) => (
                  <tr key={lesson.id}>
                    <td>{lesson.startsAt.toLocaleDateString("ru-RU")}</td>
                    <td>{lesson.group?.name ?? "Группа"}</td>
                    <td>
                      <Link href={`/teacher/lessons/${lesson.id}`}>{lesson.topic || "Открыть урок"}</Link>
                    </td>
                    <td>{markText(lesson.journalEntries[0] ?? null)}</td>
                    <td>
                      {lessonStatusLabels[lesson.lessonStatus]}
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
