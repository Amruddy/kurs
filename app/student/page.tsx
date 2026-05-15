import { PaymentStatus } from "@prisma/client";
import Link from "next/link";
import { requireWorkspace } from "@/app/lib/dev-auth";
import {
  attendanceMarkFullLabels,
  materialTypeLabels,
  paymentStatusLabels,
  progressLevelLabels,
} from "@/app/lib/learning-labels";
import { prisma } from "@/app/lib/prisma";

function formatDateTime(date: Date) {
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function scoreText(score: number | null | undefined) {
  return score === null || score === undefined ? "Нет оценки" : String(score);
}

function paymentState(payment: { status: PaymentStatus; dueAt: Date }) {
  if (payment.status === PaymentStatus.pending && payment.dueAt < new Date()) {
    return "Просрочено";
  }

  return paymentStatusLabels[payment.status];
}

function paymentTone(payment: { status: PaymentStatus; dueAt: Date }) {
  if (payment.status === PaymentStatus.paid || payment.status === PaymentStatus.exempt) {
    return "success";
  }

  if (payment.status === PaymentStatus.overdue || payment.dueAt < new Date()) {
    return "danger";
  }

  return "warning";
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

  const [nextLesson, homeworks, materials, progressRules, progressErrors, payments, recentLessons] = await Promise.all([
    student
      ? prisma.lesson.findFirst({
          where: {
            organizationId: session.organizationId,
            groupId: { in: groupIds },
            startsAt: { gte: now },
          },
          include: { group: { include: { course: true, teacher: true } }, course: true },
          orderBy: { startsAt: "asc" },
        })
      : Promise.resolve(null),
    student
      ? prisma.homework.findMany({
          where: {
            organizationId: session.organizationId,
            status: "active",
            isVisibleToStudent: true,
            OR: [{ studentId: student.id }, { groupId: { in: groupIds }, studentId: null }],
          },
          include: {
            group: true,
            lesson: true,
            materials: {
              where: { status: "active", isVisibleToStudent: true },
              orderBy: { createdAt: "desc" },
            },
          },
          orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
          take: 3,
        })
      : Promise.resolve([]),
    student
      ? prisma.material.findMany({
          where: {
            organizationId: session.organizationId,
            status: "active",
            isVisibleToStudent: true,
            OR: [{ studentId: student.id }, { groupId: { in: groupIds } }, { lesson: { groupId: { in: groupIds } } }],
          },
          include: { group: true, lesson: true, homework: true },
          orderBy: { createdAt: "desc" },
          take: 3,
        })
      : Promise.resolve([]),
    student
      ? prisma.studentProgressRule.findMany({
          where: {
            organizationId: session.organizationId,
            studentId: student.id,
            isActive: true,
            isVisibleToStudent: true,
          },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
          take: 3,
        })
      : Promise.resolve([]),
    student
      ? prisma.studentProgressError.findMany({
          where: {
            organizationId: session.organizationId,
            studentId: student.id,
            isActive: true,
            isVisibleToStudent: true,
          },
          orderBy: { createdAt: "desc" },
          take: 3,
        })
      : Promise.resolve([]),
    student
      ? prisma.payment.findMany({
          where: { organizationId: session.organizationId, studentId: student.id },
          include: { course: true, group: true },
          orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
          take: 3,
        })
      : Promise.resolve([]),
    student
      ? prisma.lesson.findMany({
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
          take: 4,
        })
      : Promise.resolve([]),
  ]);
  const nextPayment =
    payments.find((payment) => payment.status === PaymentStatus.pending || payment.status === PaymentStatus.overdue) ??
    payments[0];
  const firstCourseName = student?.groupLinks[0]?.group.course.name ?? "Не назначены";
  const homeworkDueText = homeworks[0]?.dueAt ? homeworks[0].dueAt.toLocaleDateString("ru-RU") : "Нет актуальных";
  const paymentText = nextPayment ? paymentState(nextPayment) : "Не настроена";

  return (
    <div className="role-main role-main-student">
      <header className="role-work-header">
        <div>
          <span className="status role-status">Главная страница</span>
          <p>Организация: {session.organizationName}</p>
        </div>
        <p>{student?.name ?? session.name} · {session.email}</p>
      </header>

      <section className="role-state-grid role-state-grid-five" aria-label="Ключевое состояние ученика">
        <Link className="role-state-card role-state-link" href="#student-groups">
          <span className="role-state-label">Группы</span>
          <strong>{student ? student.groupLinks.length : 0}</strong>
          <p>{firstCourseName}</p>
        </Link>
        <Link className="role-state-card role-state-link" href="/student/schedule">
          <span className="role-state-label">Урок</span>
          <strong>{nextLesson ? 1 : 0}</strong>
          <p>{nextLesson ? formatDateTime(nextLesson.startsAt) : "Нет ближайшего"}</p>
        </Link>
        <Link className="role-state-card role-state-link" href="/student/homework">
          <span className="role-state-label">ДЗ</span>
          <strong>{homeworks.length}</strong>
          <p>{homeworkDueText}</p>
        </Link>
        <Link className="role-state-card role-state-link" href="/student/materials">
          <span className="role-state-label">Материалы</span>
          <strong>{materials.length}</strong>
          <p>Доступных</p>
        </Link>
        <Link className="role-state-card role-state-link" href="/student/payments">
          <span className="role-state-label">Оплата</span>
          <strong>{nextPayment ? 1 : 0}</strong>
          <p>{paymentText}</p>
        </Link>
      </section>

      <div className="role-work-grid role-work-grid-student">
        <section className="panel role-panel role-primary-panel">
          <div className="role-panel-heading">
            <div>
              <span>Расписание</span>
              <h2>Ближайший урок</h2>
            </div>
          </div>
          {nextLesson ? (
            <div className="role-feature">
              <strong>{formatDateTime(nextLesson.startsAt)}</strong>
              <p>{nextLesson.group?.name ?? nextLesson.course.name}</p>
              <span>{nextLesson.group?.course.name ?? nextLesson.course.name}</span>
            </div>
          ) : (
            <p className="role-empty">Ближайший урок пока не создан.</p>
          )}
        </section>

        <section className="panel role-panel">
          <div className="role-panel-heading">
            <div>
              <span>ДЗ</span>
              <h2>Домашние задания</h2>
            </div>
          </div>
          {homeworks.length === 0 ? (
            <p className="role-empty">Актуальных домашних заданий пока нет.</p>
          ) : (
            <div className="role-soft-list">
              {homeworks.map((homework) => (
                <div className="role-soft-item" key={homework.id}>
                  <div>
                    <strong>{homework.title}</strong>
                    <p>{homework.group?.name ?? "Индивидуально"}</p>
                  </div>
                  <span>{homework.dueAt ? homework.dueAt.toLocaleDateString("ru-RU") : "Без срока"}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel role-panel">
          <div className="role-panel-heading">
            <div>
              <span>Материалы</span>
              <h2>Последние материалы</h2>
            </div>
          </div>
          {materials.length === 0 ? (
            <p className="role-empty">Материалов пока нет.</p>
          ) : (
            <div className="role-soft-list">
              {materials.map((material) => (
                <div className="role-soft-item" key={material.id}>
                  <div>
                    {material.url ? <Link href={material.url}>{material.title}</Link> : <strong>{material.title}</strong>}
                    <p>{material.homework ? "ДЗ" : material.lesson ? "Урок" : material.group?.name ?? "Курс"}</p>
                  </div>
                  <span className="role-badge neutral">{materialTypeLabels[material.type]}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel role-panel">
          <div className="role-panel-heading">
            <div>
              <span>Прогресс</span>
              <h2>Открытые данные</h2>
            </div>
          </div>
          {progressRules.length === 0 && progressErrors.length === 0 ? (
            <p className="role-empty">Прогресс еще не открыт.</p>
          ) : (
            <div className="role-soft-list">
              {progressRules.map((rule) => (
                <div className="role-soft-item" key={rule.id}>
                  <div>
                    <strong>{rule.name}</strong>
                    <p>{rule.note ?? "Правило без заметки"}</p>
                  </div>
                  {rule.level ? <span className="role-badge success">{progressLevelLabels[rule.level]}</span> : null}
                </div>
              ))}
              {progressErrors.map((error) => (
                <div className="role-soft-item" key={error.id}>
                  <div>
                    <strong>{error.name}</strong>
                    <p>{error.note ?? "Ошибка без заметки"}</p>
                  </div>
                  <span className="role-badge warning">{error.isRepeated ? "Повторяется" : "Ошибка"}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel role-panel">
          <div className="role-panel-heading">
            <div>
              <span>Посещаемость</span>
              <h2>Последние уроки</h2>
            </div>
          </div>
          {recentLessons.length === 0 ? (
            <p className="role-empty">Прошедших занятий пока нет.</p>
          ) : (
            <div className="role-soft-list">
              {recentLessons.map((lesson) => {
                const entry = lesson.journalEntries[0];
                return (
                  <div className="role-soft-item" key={lesson.id}>
                    <div>
                      <strong>{formatDateTime(lesson.startsAt)}</strong>
                      <p>{lesson.group?.name ?? "Индивидуально"}</p>
                    </div>
                    <div className="role-soft-meta">
                      <span>{entry?.mark ? attendanceMarkFullLabels[entry.mark] : "Присутствовал"}</span>
                      <span className="role-badge neutral">{scoreText(entry?.score)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="panel role-panel">
          <div className="role-panel-heading">
            <div>
              <span>Оплата</span>
              <h2>Ближайшая оплата</h2>
            </div>
          </div>
          {nextPayment ? (
            <div className="role-feature">
              <strong>
                {nextPayment.amount} {nextPayment.currency}
              </strong>
              <p>Срок {nextPayment.dueAt.toLocaleDateString("ru-RU")}</p>
              <span className={`role-badge ${paymentTone(nextPayment)}`}>{paymentText}</span>
            </div>
          ) : (
            <p className="role-empty">Оплата пока не настроена.</p>
          )}
        </section>

        <section className="panel role-panel role-panel-wide" id="student-groups">
          <div className="role-panel-heading">
            <div>
              <span>Группы</span>
              <h2>Мои группы</h2>
            </div>
          </div>
          {!student || student.groupLinks.length === 0 ? (
            <p className="role-empty">Учебные группы пока не назначены.</p>
          ) : (
            <div className="role-soft-list">
              {student.groupLinks.map((link) => (
                <div className="role-soft-item" key={link.id}>
                  <div>
                    <strong>{link.group.name}</strong>
                    <p>{link.group.course.name}</p>
                  </div>
                  <div className="role-soft-meta">
                    <span>{link.group.teacher?.name ?? "Преподаватель не назначен"}</span>
                    <span className="role-badge success">Активная</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
