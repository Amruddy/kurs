import Link from "next/link";
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

  return (
    <>
      <div className="page-heading">
        <span className="status">Ученик</span>
        <h1>Материалы</h1>
        <p>Тексты и ссылки для ваших групп, уроков и домашних заданий.</p>
      </div>

      <section className="panel">
        {materials.length === 0 ? (
          <p>Материалов пока нет.</p>
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
                      {material.url ? <Link href={material.url}>{material.title}</Link> : <strong>{material.title}</strong>}
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
      </section>
    </>
  );
}
