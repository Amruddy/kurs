import Link from "next/link";
import { updateStudent } from "@/app/admin/actions";
import { groupStudentStatusLabels, studentStatusLabels } from "@/app/lib/learning-labels";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { prisma } from "@/app/lib/prisma";

type AdminStudentPageProps = {
  params: Promise<{ studentId: string }>;
};

export default async function AdminStudentPage({ params }: AdminStudentPageProps) {
  const { studentId } = await params;
  const session = await requireWorkspace("admin");
  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      organizationId: session.organizationId,
    },
    include: {
      groupLinks: {
        include: {
          group: {
            include: {
              course: true,
              teacher: true,
            },
          },
        },
        orderBy: { joinedAt: "desc" },
      },
    },
  });

  if (!student) {
    return (
      <section className="panel">
        <h1>Ученик не найден</h1>
        <p>Карточка не существует или относится к другой организации.</p>
      </section>
    );
  }

  return (
    <>
      <div className="page-heading">
        <span className="status">{studentStatusLabels[student.status]}</span>
        <h1>{student.name}</h1>
        <p>Карточка ученика, контакты и текущие группы.</p>
      </div>

      <section className="panel">
        <h2>Основные данные</h2>
        <form className="form-grid" action={updateStudent.bind(null, student.id)}>
          <label>
            Имя
            <input name="name" required defaultValue={student.name} />
          </label>
          <label>
            Телефон
            <input name="phone" defaultValue={student.phone ?? ""} />
          </label>
          <label>
            Email
            <input name="email" type="email" defaultValue={student.email ?? ""} />
          </label>
          <label>
            Статус
            <select name="status" defaultValue={student.status}>
              <option value="active">Активный</option>
              <option value="paused">Приостановлен</option>
              <option value="archived">Архивный</option>
            </select>
          </label>
          <button className="button" type="submit">
            Сохранить
          </button>
        </form>
      </section>

      <section className="panel section">
        <div className="section-heading">
          <h2>Группы ученика</h2>
          <Link className="secondary-button link-button" href="/admin/groups">
            Назначить в группу
          </Link>
        </div>
        {student.groupLinks.length === 0 ? (
          <p>Ученик пока не назначен в группы.</p>
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
                    <td>
                      <Link href={`/admin/groups/${link.group.id}`}>{link.group.name}</Link>
                    </td>
                    <td>{link.group.course.name}</td>
                    <td>{link.group.teacher?.name ?? "Не назначен"}</td>
                    <td>{groupStudentStatusLabels[link.status]}</td>
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
