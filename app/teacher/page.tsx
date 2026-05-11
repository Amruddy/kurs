import { requireWorkspace } from "@/app/lib/dev-auth";
import { groupStatusLabels } from "@/app/lib/learning-labels";
import { prisma } from "@/app/lib/prisma";

export default async function TeacherPage() {
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
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <div className="page-heading">
        <span className="status">Преподаватель</span>
        <h1>Рабочая область преподавателя</h1>
        <p>
          Здесь показываются группы, назначенные текущему преподавателю. Журнал, расписание и уроки
          будут добавлены на следующих этапах.
        </p>
      </div>

      <section className="grid">
        <div className="panel">
          <h2>{session.name}</h2>
          <p>{session.email}</p>
        </div>
        <div className="panel">
          <h2>{groups.length}</h2>
          <p>Назначенных групп</p>
        </div>
        <div className="panel">
          <h2>{session.organizationName}</h2>
          <p>Организация</p>
        </div>
      </section>

      <section className="panel section">
        <h2>Мои группы</h2>
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
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <tr key={group.id}>
                    <td>{group.name}</td>
                    <td>{group.course.name}</td>
                    <td>{group.students.length}</td>
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
