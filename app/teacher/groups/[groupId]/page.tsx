import Link from "next/link";
import {
  groupStatusLabels,
  groupStudentStatusLabels,
  lessonStatusLabels,
  scheduleRuleStatusLabels,
  weekdayLabels,
} from "@/app/lib/learning-labels";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { prisma } from "@/app/lib/prisma";

type TeacherGroupPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function TeacherGroupPage({ params }: TeacherGroupPageProps) {
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
      teacher: true,
      students: {
        include: { student: true },
        orderBy: { joinedAt: "desc" },
      },
      lessons: {
        where: {
          startsAt: { gte: new Date() },
        },
        orderBy: { startsAt: "asc" },
        take: 10,
      },
    },
  });

  if (!group) {
    return (
      <section className="panel">
        <h1>Группа не найдена</h1>
        <p>Группа не существует или не назначена текущему преподавателю.</p>
      </section>
    );
  }

  const scheduleRules = await prisma.scheduleRule.findMany({
    where: {
      organizationId: session.organizationId,
      targetType: "group",
      targetId: group.id,
    },
    orderBy: [{ status: "asc" }, { weekday: "asc" }, { startTime: "asc" }],
  });

  return (
    <>
      <div className="page-heading">
        <span className="status">{groupStatusLabels[group.status]}</span>
        <h1>{group.name}</h1>
        <p>
          {group.course.name}. Преподаватель: {group.teacher?.name ?? "не назначен"}.
        </p>
      </div>

      <section className="grid">
        <div className="panel">
          <h2>{group.students.filter((link) => link.status === "active").length}</h2>
          <p>Активных учеников</p>
        </div>
        <div className="panel">
          <h2>{scheduleRules.filter((rule) => rule.status === "active").length}</h2>
          <p>Правил расписания</p>
        </div>
        <div className="panel">
          <h2>{group.lessons.length}</h2>
          <p>Ближайших уроков</p>
        </div>
      </section>

      <section className="panel section">
        <div className="button-row">
          <Link className="button link-button compact-button" href={`/teacher/groups/${group.id}/journal`}>
            Открыть журнал
          </Link>
          <Link className="secondary-button link-button compact-button" href="/teacher/attendance">
            Посещаемость
          </Link>
        </div>
      </section>

      <section className="panel section">
        <h2>Расписание</h2>
        {scheduleRules.length === 0 ? (
          <p>Расписание пока не задано.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>День</th>
                  <th>Время</th>
                  <th>Период</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {scheduleRules.map((rule) => (
                  <tr key={rule.id}>
                    <td>{weekdayLabels[rule.weekday]}</td>
                    <td>
                      {rule.startTime}
                      {rule.endTime ? `-${rule.endTime}` : ""}
                    </td>
                    <td>
                      {rule.startsOn.toLocaleDateString("ru-RU")}
                      {rule.endsOn ? ` - ${rule.endsOn.toLocaleDateString("ru-RU")}` : ""}
                    </td>
                    <td>{scheduleRuleStatusLabels[rule.status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel section">
        <h2>Ближайшие уроки</h2>
        {group.lessons.length === 0 ? (
          <p>Ближайшие уроки пока не созданы.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Время</th>
                  <th>Статус урока</th>
                  <th>Действие</th>
                </tr>
              </thead>
              <tbody>
                {group.lessons.map((lesson) => (
                  <tr key={lesson.id}>
                    <td>{lesson.startsAt.toLocaleDateString("ru-RU")}</td>
                    <td>
                      {lesson.startsAt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                      {lesson.endsAt
                        ? `-${lesson.endsAt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`
                        : ""}
                    </td>
                    <td>{lessonStatusLabels[lesson.lessonStatus]}</td>
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

      <section className="panel section">
        <h2>Состав группы</h2>
        {group.students.length === 0 ? (
          <p>В группе пока нет учеников.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ученик</th>
                  <th>Контакты</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {group.students.map((link) => (
                  <tr key={link.id}>
                    <td>{link.student.name}</td>
                    <td>{[link.student.phone, link.student.email].filter(Boolean).join(", ") || "Не указаны"}</td>
                    <td>{groupStudentStatusLabels[link.status]}</td>
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
