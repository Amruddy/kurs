import Link from "next/link";
import { createStudent } from "@/app/admin/actions";
import { studentStatusLabels } from "@/app/lib/learning-labels";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { prisma } from "@/app/lib/prisma";

export default async function AdminStudentsPage() {
  const session = await requireWorkspace("admin");
  const students = await prisma.student.findMany({
    where: { organizationId: session.organizationId },
    include: {
      groupLinks: {
        include: {
          group: {
            include: { course: true },
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
          <span className="admin-badge">Ученики</span>
          <h1>Управление учениками</h1>
          <p>Учебные карточки, контактные данные, группы и текущий статус учеников.</p>
        </div>
      </header>

      <section className="panel admin-panel admin-form-panel">
        <div className="admin-section-heading">
          <div>
            <span className="admin-kicker">Создание</span>
            <h2>Новый ученик</h2>
          </div>
        </div>
        <form className="form-grid" action={createStudent}>
          <label>
            Имя
            <input name="name" required placeholder="Имя ученика" />
          </label>
          <label>
            Телефон
            <input name="phone" placeholder="+7..." />
          </label>
          <label>
            Email
            <input name="email" type="email" placeholder="student@example.test" />
          </label>
          <label>
            Статус
            <select name="status" defaultValue="active">
              <option value="active">Активный</option>
              <option value="paused">Приостановлен</option>
              <option value="archived">Архивный</option>
            </select>
          </label>
          <button className="button" type="submit">
            Создать ученика
          </button>
        </form>
      </section>

      <section className="panel admin-panel">
        <div className="admin-section-heading">
          <div>
            <span className="admin-kicker">Состав школы</span>
            <h2>Список учеников</h2>
          </div>
        </div>
        {students.length === 0 ? (
          <p>Учеников пока нет.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Имя</th>
                  <th>Контакты</th>
                  <th>Группы</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <Link href={`/admin/students/${student.id}`}>{student.name}</Link>
                    </td>
                    <td>{[student.phone, student.email].filter(Boolean).join(", ") || "Не указаны"}</td>
                    <td>
                      {student.groupLinks
                        .filter((link) => link.status === "active")
                        .map((link) => link.group.name)
                        .join(", ") || "Не назначен"}
                    </td>
                    <td>
                      <span className={`admin-badge status-${student.status}`}>
                        {studentStatusLabels[student.status]}
                      </span>
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
