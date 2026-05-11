import { Role } from "@prisma/client";
import { createTeacher } from "@/app/admin/actions";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { prisma } from "@/app/lib/prisma";

export default async function AdminTeachersPage() {
  const session = await requireWorkspace("admin");
  const teachers = await prisma.organizationMember.findMany({
    where: {
      organizationId: session.organizationId,
      status: "active",
      roles: { has: Role.teacher },
    },
    include: {
      user: {
        include: {
          teachingGroups: {
            where: { organizationId: session.organizationId },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <div className="page-heading">
        <span className="status">Преподаватели</span>
        <h1>Управление преподавателями</h1>
        <p>Добавьте преподавателя в организацию, чтобы назначать его на группы.</p>
      </div>

      <section className="panel">
        <h2>Новый преподаватель</h2>
        <form className="form-grid" action={createTeacher}>
          <label>
            Имя
            <input name="name" required placeholder="Имя преподавателя" />
          </label>
          <label>
            Email
            <input name="email" type="email" required placeholder="teacher@example.test" />
          </label>
          <label>
            Телефон
            <input name="phone" placeholder="+7..." />
          </label>
          <button className="button" type="submit">
            Добавить преподавателя
          </button>
        </form>
      </section>

      <section className="panel section">
        <h2>Список преподавателей</h2>
        {teachers.length === 0 ? (
          <p>Преподавателей пока нет.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Имя</th>
                  <th>Email</th>
                  <th>Телефон</th>
                  <th>Группы</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr key={teacher.id}>
                    <td>{teacher.user.name}</td>
                    <td>{teacher.user.email}</td>
                    <td>{teacher.user.phone ?? "Не указан"}</td>
                    <td>{teacher.user.teachingGroups.length}</td>
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
