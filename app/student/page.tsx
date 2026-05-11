import { requireWorkspace } from "@/app/lib/dev-auth";
import { groupStatusLabels } from "@/app/lib/learning-labels";
import { prisma } from "@/app/lib/prisma";

export default async function StudentPage() {
  const session = await requireWorkspace("student");
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

  return (
    <>
      <div className="page-heading">
        <span className="status">Ученик</span>
        <h1>Кабинет ученика</h1>
        <p>Минимальная учебная карточка: курсы и активные группы. Расписание и задания будут добавлены позже.</p>
      </div>

      <section className="grid">
        <div className="panel">
          <h2>{session.name}</h2>
          <p>{session.email}</p>
        </div>
        <div className="panel">
          <h2>{student?.groupLinks.length ?? 0}</h2>
          <p>Активных групп</p>
        </div>
        <div className="panel">
          <h2>{session.organizationName}</h2>
          <p>Организация</p>
        </div>
      </section>

      <section className="panel section">
        <h2>Мои группы</h2>
        {!student || student.groupLinks.length === 0 ? (
          <p>Учебные группы пока не назначены.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Группа</th>
                  <th>Курс</th>
                  <th>Преподаватель</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {student.groupLinks.map((link) => (
                  <tr key={link.id}>
                    <td>{link.group.name}</td>
                    <td>{link.group.course.name}</td>
                    <td>{link.group.teacher?.name ?? "Не назначен"}</td>
                    <td>{groupStatusLabels[link.group.status]}</td>
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
