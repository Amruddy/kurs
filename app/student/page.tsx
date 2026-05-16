import { PaymentStatus } from "@prisma/client";
import { attendanceMarkFullLabels, paymentStatusLabels, progressLevelLabels } from "@/app/lib/learning-labels";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { prisma } from "@/app/lib/prisma";

function formatDateTime(date: Date) {
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(date: Date) {
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function paymentState(payment: { status: PaymentStatus; dueAt: Date }) {
  if (payment.status === PaymentStatus.pending && payment.dueAt < new Date()) {
    return "Просрочено";
  }

  return paymentStatusLabels[payment.status];
}

export default async function StudentPage() {
  const session = await requireWorkspace("student");
  const now = new Date();
  const student = await prisma.student.findFirst({
    where: {
      organizationId: session.organizationId,
      userId: session.userId,
    },
    include: {
      groupLinks: {
        where: { status: "active" },
        include: {
          group: {
            include: {
              course: true,
              teacher: true,
            },
          },
        },
      },
    },
  });
  const groupIds = student?.groupLinks.map((link) => link.groupId) ?? [];

  const [
    nextLesson,
    homeworks,
    materials,
    progressRules,
    progressErrors,
    progressRecords,
    priorityPayment,
    latestPayment,
    latestCompletedLesson,
  ] = student
    ? await Promise.all([
        prisma.lesson.findFirst({
          where: {
            organizationId: session.organizationId,
            groupId: { in: groupIds },
            startsAt: { gte: now },
          },
          include: { group: { include: { course: true, teacher: true } }, course: true },
          orderBy: { startsAt: "asc" },
        }),
        prisma.homework.findMany({
          where: {
            organizationId: session.organizationId,
            status: "active",
            isVisibleToStudent: true,
            OR: [{ studentId: student.id }, { groupId: { in: groupIds }, studentId: null }],
          },
          include: {
            group: true,
            materials: {
              where: { status: "active", isVisibleToStudent: true },
              orderBy: { createdAt: "desc" },
              take: 2,
            },
          },
          orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
          take: 2,
        }),
        prisma.material.findMany({
          where: {
            organizationId: session.organizationId,
            status: "active",
            isVisibleToStudent: true,
            OR: [{ studentId: student.id }, { groupId: { in: groupIds } }, { lesson: { groupId: { in: groupIds } } }],
          },
          include: { group: true, lesson: true, homework: true },
          orderBy: { createdAt: "desc" },
          take: 3,
        }),
        prisma.studentProgressRule.findMany({
          where: {
            organizationId: session.organizationId,
            studentId: student.id,
            isActive: true,
            isVisibleToStudent: true,
          },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
          take: 3,
        }),
        prisma.studentProgressError.findMany({
          where: {
            organizationId: session.organizationId,
            studentId: student.id,
            isActive: true,
            isVisibleToStudent: true,
          },
          orderBy: { createdAt: "desc" },
          take: 3,
        }),
        prisma.progressRecord.findMany({
          where: {
            organizationId: session.organizationId,
            studentId: student.id,
            OR: [{ showRepeatText: true }, { showStudentComment: true }],
          },
          orderBy: { createdAt: "desc" },
          take: 2,
        }),
        prisma.payment.findFirst({
          where: {
            organizationId: session.organizationId,
            studentId: student.id,
            status: { in: [PaymentStatus.pending, PaymentStatus.overdue] },
          },
          include: { course: true, group: true },
          orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
        }),
        prisma.payment.findFirst({
          where: {
            organizationId: session.organizationId,
            studentId: student.id,
          },
          include: { course: true, group: true },
          orderBy: [{ dueAt: "desc" }, { createdAt: "desc" }],
        }),
        prisma.lesson.findFirst({
          where: {
            organizationId: session.organizationId,
            groupId: { in: groupIds },
            startsAt: { lt: now },
          },
          include: {
            group: { include: { course: true, teacher: true } },
            course: true,
            journalEntries: { where: { studentId: student.id } },
          },
          orderBy: { startsAt: "desc" },
        }),
      ])
    : [null, [], [], [], [], [], null, null, null];

  const payment = priorityPayment ?? latestPayment;
  const latestAttendanceEntry = latestCompletedLesson?.journalEntries[0] ?? null;
  const latestAttendanceText = latestAttendanceEntry?.mark
    ? attendanceMarkFullLabels[latestAttendanceEntry.mark]
    : latestCompletedLesson
      ? "Присутствовал"
      : "Нет истории";

  return (
    <>
      <section className="student-overview-grid">
        <div className="panel student-main-panel">
          <span className="status">Ближайшее</span>
          <h2>Следующий урок</h2>
          {nextLesson ? (
            <div className="student-highlight">
              <strong>{formatDateTime(nextLesson.startsAt)}</strong>
              <p>
                {nextLesson.group?.name ?? nextLesson.course.name} ·{" "}
                {nextLesson.group?.course.name ?? nextLesson.course.name}
                {nextLesson.group?.teacher ? ` · ${nextLesson.group.teacher.name}` : ""}
              </p>
            </div>
          ) : (
            <p>Ближайший урок пока не создан.</p>
          )}
        </div>

        <aside className="panel student-side-panel">
          <span className="status">Оплата</span>
          <h2>Ближайший срок</h2>
          {payment ? (
            <div className="student-highlight compact">
              <strong>
                {payment.amount} {payment.currency}
              </strong>
              <p>
                {payment.group?.name ?? payment.course.name} · срок {formatDate(payment.dueAt)} · {paymentState(payment)}
              </p>
            </div>
          ) : (
            <p>Оплата пока не настроена.</p>
          )}
        </aside>
      </section>

      <section className="student-overview-grid section">
        <div className="panel student-main-panel">
          <span className="status">Подготовка</span>
          <h2>Что подготовить</h2>
          {homeworks.length === 0 ? (
            <p className="empty-state">Актуальных домашних заданий пока нет.</p>
          ) : (
            <div className="student-list">
              {homeworks.map((homework) => (
                <article className="student-list-item" key={homework.id}>
                  <div>
                    <strong>{homework.title}</strong>
                    <p>{homework.text}</p>
                  </div>
                  <span>{homework.dueAt ? formatDate(homework.dueAt) : "Без срока"}</span>
                  {homework.materials.length > 0 ? (
                    <p className="student-list-note">
                      Материалы: {homework.materials.map((material) => material.title).join(", ")}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="panel student-side-panel">
          <span className="status">Материалы</span>
          <h2>Последнее открытое</h2>
          {materials.length === 0 ? (
            <p className="empty-state">Материалов пока нет.</p>
          ) : (
            <div className="student-list compact">
              {materials.map((material) => (
                <article className="student-list-item compact" key={material.id}>
                  {material.url ? <a href={material.url}>{material.title}</a> : <strong>{material.title}</strong>}
                  <p>{material.homework ? "Домашнее задание" : material.lesson ? "Урок" : material.group?.name ?? "Курс"}</p>
                </article>
              ))}
            </div>
          )}
        </aside>
      </section>

      <section className="student-overview-grid section">
        <div className="panel student-main-panel">
          <span className="status">Прогресс</span>
          <h2>Открыто преподавателем</h2>
          {progressRules.length === 0 && progressErrors.length === 0 && progressRecords.length === 0 ? (
            <p>Прогресс пока не открыт.</p>
          ) : (
            <div className="student-progress-grid">
              <div>
                <h3>Правила</h3>
                {progressRules.length === 0 ? (
                  <p className="empty-state">Пока нет открытых правил.</p>
                ) : (
                  <ul className="muted-list">
                    {progressRules.map((rule) => (
                      <li key={rule.id}>
                        {rule.name}
                        {rule.level ? `: ${progressLevelLabels[rule.level]}` : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h3>Повторить</h3>
                {progressRecords.length === 0 && progressErrors.length === 0 ? (
                  <p className="empty-state">Пока нет открытых замечаний.</p>
                ) : (
                  <ul className="muted-list">
                    {progressErrors.map((error) => (
                      <li key={error.id}>
                        {error.name}
                        {error.isRepeated ? " - повторяется" : ""}
                      </li>
                    ))}
                    {progressRecords.map((record) => (
                      <li key={record.id}>
                        {record.showRepeatText && record.repeatText ? record.repeatText : null}
                        {record.showStudentComment && record.studentComment ? ` ${record.studentComment}` : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        <aside className="panel student-side-panel">
          <span className="status">Группы</span>
          <h2>Мое обучение</h2>
          {!student || student.groupLinks.length === 0 ? (
            <p>Учебные группы пока не назначены.</p>
          ) : (
            <div className="student-list compact">
              <article className="student-list-item compact">
                <strong>{student.groupLinks.map((link) => link.group.name).join(", ")}</strong>
                <p>{student.groupLinks.map((link) => link.group.course.name).join(", ")}</p>
                <span>{student.groupLinks.map((link) => link.group.teacher?.name ?? "Преподаватель не назначен").join(", ")}</span>
              </article>
              <article className="student-list-item compact">
                <strong>{latestAttendanceText}</strong>
                <p>
                  {latestCompletedLesson
                    ? `${formatDate(latestCompletedLesson.startsAt)} · ${latestCompletedLesson.group?.name ?? latestCompletedLesson.course.name}`
                    : "Прошедших уроков пока нет"}
                </p>
                <span>Последний урок</span>
              </article>
            </div>
          )}
        </aside>
      </section>
    </>
  );
}
