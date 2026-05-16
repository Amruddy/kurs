import { requireWorkspace } from "@/app/lib/dev-auth";
import { prisma } from "@/app/lib/prisma";

function formatDate(date: Date) {
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function StudentHomeworkPage() {
  const session = await requireWorkspace("student");
  const student = await prisma.student.findFirst({
    where: { organizationId: session.organizationId, userId: session.userId },
    include: { groupLinks: { where: { status: "active" } } },
  });
  const groupIds = student?.groupLinks.map((link) => link.groupId) ?? [];
  const homeworks = student
    ? await prisma.homework.findMany({
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
      })
    : [];
  const nearestHomework = homeworks[0] ?? null;
  const individualCount = homeworks.filter((homework) => homework.studentId).length;
  const withMaterialsCount = homeworks.filter((homework) => homework.materials.length > 0).length;
  const withoutDueDateCount = homeworks.filter((homework) => !homework.dueAt).length;

  return (
    <>
      <div className="page-heading">
        <h1>Домашние задания</h1>
      </div>

      <section className="student-overview-grid">
        <div className="panel student-main-panel">
          <div className="section-heading">
            <div>
              <span className="status">Список</span>
              <h2>Актуальные задания</h2>
            </div>
          </div>
          {homeworks.length === 0 ? (
            <p className="empty-state">Актуальных домашних заданий пока нет.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Задание</th>
                    <th>Группа</th>
                    <th>Срок</th>
                    <th>Материалы</th>
                  </tr>
                </thead>
                <tbody>
                  {homeworks.map((homework) => (
                    <tr key={homework.id}>
                      <td>
                        <strong>{homework.title}</strong>
                        <p>{homework.text}</p>
                      </td>
                      <td>{homework.group?.name ?? "Индивидуально"}</td>
                      <td>{homework.dueAt ? formatDate(homework.dueAt) : "Без срока"}</td>
                      <td>
                        {homework.materials.length === 0 ? (
                          "Нет"
                        ) : (
                          <div className="student-list compact">
                            {homework.materials.map((material) => (
                              <span key={material.id}>
                                {material.url ? <a href={material.url}>{material.title}</a> : material.title}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="panel student-side-panel">
          <span className="status">Ближайшее</span>
          <h2>Что подготовить</h2>
          {nearestHomework ? (
            <div className="student-list">
              <article className="student-list-item compact">
                <strong>{nearestHomework.title}</strong>
                <p>{nearestHomework.text}</p>
                <span>{nearestHomework.dueAt ? formatDate(nearestHomework.dueAt) : "Без срока"}</span>
              </article>
            </div>
          ) : (
            <p className="empty-state">Заданий для подготовки пока нет.</p>
          )}
        </aside>
      </section>

      <section className="metric-grid section" aria-label="Сводка домашних заданий ученика">
        <div className="panel metric-card">
          <span>Задания</span>
          <strong>{homeworks.length}</strong>
          <p>Открыто сейчас</p>
        </div>
        <div className="panel metric-card">
          <span>Индивидуальные</span>
          <strong>{individualCount}</strong>
          <p>Назначены лично</p>
        </div>
        <div className="panel metric-card">
          <span>С материалами</span>
          <strong>{withMaterialsCount}</strong>
          <p>Есть что открыть</p>
        </div>
        <div className="panel metric-card">
          <span>Без срока</span>
          <strong>{withoutDueDateCount}</strong>
          <p>Действует до уточнения</p>
        </div>
      </section>
    </>
  );
}
