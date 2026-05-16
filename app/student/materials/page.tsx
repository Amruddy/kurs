import { requireWorkspace } from "@/app/lib/dev-auth";
import { materialTypeLabels } from "@/app/lib/learning-labels";
import { prisma } from "@/app/lib/prisma";

export default async function StudentMaterialsPage() {
  const session = await requireWorkspace("student");
  const student = await prisma.student.findFirst({
    where: { organizationId: session.organizationId, userId: session.userId },
    include: { groupLinks: { where: { status: "active" } } },
  });
  const groupIds = student?.groupLinks.map((link) => link.groupId) ?? [];
  const materials = student
    ? await prisma.material.findMany({
        where: {
          organizationId: session.organizationId,
          status: "active",
          isVisibleToStudent: true,
          OR: [{ studentId: student.id }, { groupId: { in: groupIds } }, { lesson: { groupId: { in: groupIds } } }],
        },
        include: { group: true, lesson: true, homework: true },
        orderBy: { createdAt: "desc" },
      })
    : [];
  const latestMaterial = materials[0] ?? null;
  const linkCount = materials.filter((material) => material.type === "link").length;
  const textCount = materials.filter((material) => material.type === "text").length;
  const homeworkMaterialsCount = materials.filter((material) => material.homeworkId).length;

  return (
    <>
      <div className="page-heading">
        <h1>Материалы</h1>
      </div>

      <section className="student-overview-grid">
        <div className="panel student-main-panel">
          <div className="section-heading">
            <div>
              <span className="status">Список</span>
              <h2>Открытые материалы</h2>
            </div>
          </div>
          {materials.length === 0 ? (
            <p className="empty-state">Материалов пока нет.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Материал</th>
                    <th>Тип</th>
                    <th>Привязка</th>
                    <th>Описание</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((material) => (
                    <tr key={material.id}>
                      <td>
                        {material.url ? <a href={material.url}>{material.title}</a> : <strong>{material.title}</strong>}
                        {material.content ? <p>{material.content}</p> : null}
                      </td>
                      <td>{materialTypeLabels[material.type]}</td>
                      <td>{material.homework ? "ДЗ" : material.lesson ? "Урок" : material.group?.name ?? "Курс"}</td>
                      <td>{material.description ?? "Без описания"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="panel student-side-panel">
          <span className="status">Последнее</span>
          <h2>Недавно открыто</h2>
          {latestMaterial ? (
            <div className="student-list">
              <article className="student-list-item compact">
                {latestMaterial.url ? <a href={latestMaterial.url}>{latestMaterial.title}</a> : <strong>{latestMaterial.title}</strong>}
                <p>{latestMaterial.homework ? "Домашнее задание" : latestMaterial.lesson ? "Урок" : latestMaterial.group?.name ?? "Курс"}</p>
                <span>{materialTypeLabels[latestMaterial.type]}</span>
              </article>
            </div>
          ) : (
            <p className="empty-state">Открытых материалов пока нет.</p>
          )}
        </aside>
      </section>

      <section className="metric-grid section" aria-label="Сводка материалов ученика">
        <div className="panel metric-card">
          <span>Материалы</span>
          <strong>{materials.length}</strong>
          <p>Открыто ученику</p>
        </div>
        <div className="panel metric-card">
          <span>Ссылки</span>
          <strong>{linkCount}</strong>
          <p>Можно открыть отдельно</p>
        </div>
        <div className="panel metric-card">
          <span>Тексты</span>
          <strong>{textCount}</strong>
          <p>Внутри системы</p>
        </div>
        <div className="panel metric-card">
          <span>Для ДЗ</span>
          <strong>{homeworkMaterialsCount}</strong>
          <p>Связано с заданиями</p>
        </div>
      </section>
    </>
  );
}
