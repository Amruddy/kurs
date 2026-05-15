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
    <div className="admin-workspace">
      <header className="admin-page-header">
        <div className="admin-page-header-copy">
          <span className="admin-badge">Преподаватели</span>
          <h1>Управление преподавателями</h1>
          <p>Активные преподаватели организации и количество назначенных групп.</p>
        </div>
      </header>

      <section className="panel admin-panel admin-form-panel">
        <div className="admin-section-heading">
          <div>
            <span className="admin-kicker">Создание</span>
            <h2>Новый преподаватель</h2>
          </div>
        </div>
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

      <section className="panel admin-panel">
        <div className="admin-section-heading">
          <div>
            <span className="admin-kicker">Команда</span>
            <h2>Список преподавателей</h2>
          </div>
        </div>
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
                    <td>
                      <span className="admin-badge">{teacher.user.teachingGroups.length}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
