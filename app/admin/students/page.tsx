import Link from "next/link";
import { createStudent } from "@/app/admin/actions";
import { PageCreateAction } from "@/app/components/page-create-action";
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
    <>
      <div className="page-heading page-heading-with-action">
        <div>
          <span className="status">Ученики</span>
          <h1>Управление учениками</h1>
          <p>Создайте учебную карточку ученика. Аккаунт пользователя для ученика пока необязателен.</p>
        </div>
        <PageCreateAction buttonLabel="Создать ученика" title="Новый ученик">
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
        </PageCreateAction>
      </div>

      <section className="panel">
        <h2>Список учеников</h2>
        {students.length === 0 ? (
          <p className="empty-state">Учеников пока нет.</p>
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
                    <td>{studentStatusLabels[student.status]}</td>
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
