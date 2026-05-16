import Link from "next/link";
import { PaymentStatus } from "@prisma/client";
import {
  attendanceMarkFullLabels,
  groupStatusLabels,
  paymentStatusLabels,
  progressLevelLabels,
} from "@/app/lib/learning-labels";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { prisma } from "@/app/lib/prisma";
import { createProgressError, createProgressRecord, createProgressRule } from "@/app/teacher/actions";

type TeacherStudentPageProps = {
  params: Promise<{ studentId: string }>;
};

function formatDate(date: Date) {
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatPayment(amount: number, currency: string) {
  return `${amount} ${currency}`;
}

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
  const courseIds = links.map((link) => link.group.courseId);
  const lessons = await prisma.lesson.findMany({
    where: {
      organizationId: session.organizationId,
      teacherId: session.userId,
      groupId: { in: groupIds },
      startsAt: { lt: new Date() },
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
  const [rules, errors, progressRecords, homeworks, materials, payments] = await Promise.all([
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
    prisma.payment.findMany({
      where: {
        organizationId: session.organizationId,
        studentId: student.id,
        OR: [{ groupId: { in: groupIds } }, { groupId: null, courseId: { in: courseIds } }],
      },
      include: { group: true, course: true },
      orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
      take: 8,
    }),
  ]);
  const absentCount = lessons.filter((lesson) => lesson.journalEntries[0]?.mark === "absent").length;
  const excusedCount = lessons.filter((lesson) => lesson.journalEntries[0]?.mark === "excused").length;
  const presentCount = Math.max(lessons.length - absentCount - excusedCount, 0);
  const attendancePercent = lessons.length > 0 ? Math.round((presentCount / lessons.length) * 100) : 0;
  const paymentsAttentionCount = payments.filter(
    (payment) => payment.status === PaymentStatus.overdue || (payment.status === PaymentStatus.pending && payment.dueAt < new Date()),
  ).length;

  return (
    <>
      <div className="page-heading">
        <h1>{student.name}</h1>
      </div>

      <section className="teacher-overview-grid">
        <div className="panel teacher-main-panel">
          <span className="status">Ученик</span>
          <h2>Учебная карточка</h2>
          <div className="teacher-list">
            <div className="teacher-list-item">
              <strong>{[student.phone, student.email].filter(Boolean).join(", ") || "Контакты не указаны"}</strong>
              <span>Контакты</span>
            </div>
            <div className="teacher-list-item">
              <strong>{links.map((link) => link.group.course.name).join(", ")}</strong>
              <span>Курсы</span>
            </div>
            <div className="teacher-list-item">
              <strong>{lessons.length > 0 ? `${attendancePercent}%` : "Нет данных"}</strong>
              <span>Посещаемость по последним урокам</span>
            </div>
          </div>
        </div>

        <aside className="panel teacher-side-panel">
          <span className="status">Группы</span>
          <h2>Активное обучение</h2>
          <div className="teacher-group-list">
            {links.map((link) => (
              <article className="teacher-group-card" key={link.id}>
                <Link href={`/teacher/groups/${link.group.id}`}>{link.group.name}</Link>
                <p>{link.group.course.name}</p>
                <span>{groupStatusLabels[link.group.status]}</span>
              </article>
            ))}
          </div>
        </aside>
      </section>

      <section className="metric-grid section" aria-label="Сводка ученика">
        <div className="panel metric-card">
          <span>Уроки</span>
          <strong>{lessons.length}</strong>
          <p>Последняя история</p>
        </div>
        <div className="panel metric-card">
          <span>Посещаемость</span>
          <strong>{lessons.length > 0 ? `${attendancePercent}%` : "0%"}</strong>
          <p>Был на {presentCount} уроках</p>
        </div>
        <div className="panel metric-card">
          <span>Прогресс</span>
          <strong>{rules.length + errors.length}</strong>
          <p>Правила и ошибки</p>
        </div>
        <div className="panel metric-card">
          <span>Оплата</span>
          <strong>{paymentsAttentionCount}</strong>
          <p>Требует внимания</p>
        </div>
      </section>

      <section className="lesson-workspace-grid section">
        <form className="panel lesson-workspace-card" action={createProgressRule.bind(null, student.id)}>
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

        <form className="panel lesson-workspace-card" action={createProgressError.bind(null, student.id)}>
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

      <section className="teacher-progress-grid section">
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

      <section className="teacher-overview-grid section">
        <div className="panel teacher-main-panel">
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

        <aside className="panel teacher-side-panel">
          <span className="status">Оплата</span>
          <h2>Статусы платежей</h2>
          {payments.length === 0 ? (
            <p>Оплата для этого ученика пока не настроена.</p>
          ) : (
            <div className="teacher-payment-list">
              {payments.map((payment) => (
                <article className="teacher-payment-row" key={payment.id}>
                  <div>
                    <strong>{payment.group?.name ?? payment.course.name}</strong>
                    <p>срок {formatDate(payment.dueAt)}</p>
                  </div>
                  <strong>{formatPayment(payment.amount, payment.currency)}</strong>
                  <span>{paymentStatusLabels[payment.status]}</span>
                </article>
              ))}
            </div>
          )}
        </aside>
      </section>

      <section className="teacher-overview-grid section">
        <div className="panel teacher-main-panel">
          <span className="status">Домашние задания</span>
          <h2>Активные задания</h2>
          {homeworks.length === 0 ? (
            <p>Домашние задания пока не назначены.</p>
          ) : (
            <div className="teacher-list">
              {homeworks.map((homework) => (
                <article className="teacher-list-item" key={homework.id}>
                  <strong>{homework.title}</strong>
                  <span>
                    {homework.group?.name ?? "Группа"} · {homework.dueAt ? formatDate(homework.dueAt) : "без срока"}
                  </span>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="panel teacher-side-panel">
          <span className="status">Материалы</span>
          <h2>Последние материалы</h2>
          {materials.length === 0 ? (
            <p>Материалы пока не добавлены.</p>
          ) : (
            <div className="teacher-list">
              {materials.map((material) => (
                <article className="teacher-list-item" key={material.id}>
                  {material.url ? <a href={material.url}>{material.title}</a> : <strong>{material.title}</strong>}
                  <span>{material.group?.name ?? "Курс"}</span>
                </article>
              ))}
            </div>
          )}
        </aside>
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
