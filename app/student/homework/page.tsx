import Link from "next/link";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { prisma } from "@/app/lib/prisma";

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

  return (
    <>
      <div className="page-heading">
        <span className="status">Ученик</span>
        <h1>Домашние задания</h1>
        <p>Видны только открытые задания для ваших групп и лично для вас.</p>
      </div>

      <section className="panel">
        {homeworks.length === 0 ? (
          <p>Актуальных домашних заданий пока нет.</p>
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
                    <td>{homework.dueAt ? homework.dueAt.toLocaleDateString("ru-RU") : "Без срока"}</td>
                    <td>
                      {homework.materials.length === 0
                        ? "Нет"
                        : homework.materials.map((material) =>
                            material.url ? (
                              <Link key={material.id} href={material.url}>
                                {material.title}
                              </Link>
                            ) : (
                              material.title
                            ),
                          )}
                    </td>
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
