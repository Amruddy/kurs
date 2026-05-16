import Link from "next/link";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { groupStatusLabels } from "@/app/lib/learning-labels";
import { prisma } from "@/app/lib/prisma";

function formatDateTime(date: Date) {
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function TeacherGroupsPage() {
  const session = await requireWorkspace("teacher");
  const groups = await prisma.group.findMany({
    where: {
      organizationId: session.organizationId,
      teacherId: session.userId,
      status: { not: "archived" },
    },
    include: {
      course: true,
      students: {
        where: { status: "active" },
      },
      lessons: {
        where: {
          startsAt: { gte: new Date() },
        },
        orderBy: { startsAt: "asc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });
  const studentCount = new Set(groups.flatMap((group) => group.students.map((link) => link.studentId))).size;
  const groupsWithNextLessonCount = groups.filter((group) => group.lessons.length > 0).length;

  return (
    <>
      <div className="page-heading">
        <h1>Мои группы</h1>
      </div>

      <section className="panel">
        {groups.length === 0 ? (
          <p>Пока нет назначенных групп.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Группа</th>
                  <th>Курс</th>
                  <th>Ученики</th>
                  <th>Ближайший урок</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <tr key={group.id}>
                    <td>
                      <Link href={`/teacher/groups/${group.id}`}>{group.name}</Link>
                    </td>
                    <td>{group.course.name}</td>
                    <td>{group.students.length}</td>
                    <td>{group.lessons[0] ? formatDateTime(group.lessons[0].startsAt) : "Нет"}</td>
                    <td>{groupStatusLabels[group.status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="metric-grid section" aria-label="Сводка групп преподавателя">
        <div className="panel metric-card">
          <span>Группы</span>
          <strong>{groups.length}</strong>
          <p>Активные и неархивные</p>
        </div>
        <div className="panel metric-card">
          <span>Ученики</span>
          <strong>{studentCount}</strong>
          <p>Уникальные ученики в группах</p>
        </div>
        <div className="panel metric-card">
          <span>С уроками</span>
          <strong>{groupsWithNextLessonCount}</strong>
          <p>Есть ближайшее занятие</p>
        </div>
        <div className="panel metric-card">
          <span>Без урока</span>
          <strong>{groups.length - groupsWithNextLessonCount}</strong>
          <p>Нужно проверить расписание</p>
        </div>
      </section>
    </>
  );
}
