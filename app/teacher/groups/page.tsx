import Link from "next/link";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { groupStatusLabels } from "@/app/lib/learning-labels";
import { prisma } from "@/app/lib/prisma";

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
          lessonStatus: "scheduled",
          startsAt: { gte: new Date() },
        },
        orderBy: { startsAt: "asc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <div className="page-heading">
        <span className="status">Группы</span>
        <h1>Мои группы</h1>
        <p>Группы, назначенные текущему преподавателю, и ближайшие запланированные уроки.</p>
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
                    <td>
                      {group.lessons[0]
                        ? group.lessons[0].startsAt.toLocaleString("ru-RU", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Нет"}
                    </td>
                    <td>{groupStatusLabels[group.status]}</td>
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
