import Link from "next/link";
import { Role } from "@prisma/client";
import { addStudentToGroup, removeStudentFromGroup, updateGroup } from "@/app/admin/actions";
import { groupStatusLabels, groupStudentStatusLabels } from "@/app/lib/learning-labels";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { prisma } from "@/app/lib/prisma";

type AdminGroupPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function AdminGroupPage({ params }: AdminGroupPageProps) {
  const { groupId } = await params;
  const session = await requireWorkspace("admin");
  const [group, teachers, students] = await Promise.all([
    prisma.group.findFirst({
      where: {
        id: groupId,
        organizationId: session.organizationId,
      },
      include: {
        course: true,
        teacher: true,
        students: {
          include: { student: true },
          orderBy: { joinedAt: "desc" },
        },
      },
    }),
    prisma.organizationMember.findMany({
      where: {
        organizationId: session.organizationId,
        status: "active",
        roles: { has: Role.teacher },
      },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.student.findMany({
      where: {
        organizationId: session.organizationId,
        status: { not: "archived" },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!group) {
    return (
      <section className="panel">
        <h1>Группа не найдена</h1>
        <p>Группа не существует или относится к другой организации.</p>
      </section>
    );
  }

  const activeStudentIds = new Set(
    group.students.filter((link) => link.status === "active").map((link) => link.studentId),
  );
  const availableStudents = students.filter((student) => !activeStudentIds.has(student.id));

  return (
    <>
      <div className="page-heading">
        <span className="status">{groupStatusLabels[group.status]}</span>
        <h1>{group.name}</h1>
        <p>
          {group.course.name}. Преподаватель: {group.teacher?.name ?? "не назначен"}.
        </p>
      </div>

      <section className="panel">
        <h2>Основные данные</h2>
        <form className="form-grid" action={updateGroup.bind(null, group.id)}>
          <label>
            Название
            <input name="name" required defaultValue={group.name} />
          </label>
          <label>
            Преподаватель
            <select name="teacherId" defaultValue={group.teacherId ?? ""}>
              <option value="">Назначить позже</option>
              {teachers.map((teacher) => (
                <option key={teacher.userId} value={teacher.userId}>
                  {teacher.user.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Статус
            <select name="status" defaultValue={group.status}>
              <option value="recruiting">Набор</option>
              <option value="active">Активная</option>
              <option value="paused">Приостановлена</option>
              <option value="completed">Завершена</option>
              <option value="archived">Архивная</option>
            </select>
          </label>
          <button className="button" type="submit">
            Сохранить
          </button>
        </form>
      </section>

      <section className="panel section">
        <h2>Добавить ученика</h2>
        <form className="form-grid" action={addStudentToGroup.bind(null, group.id)}>
          <label>
            Ученик
            <select name="studentId" required defaultValue="">
              <option value="" disabled>
                Выберите ученика
              </option>
              {availableStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </label>
          <button className="button" type="submit" disabled={availableStudents.length === 0}>
            Добавить в группу
          </button>
        </form>
        {availableStudents.length === 0 ? <p className="form-note">Нет доступных учеников для добавления.</p> : null}
      </section>

      <section className="panel section">
        <h2>Состав группы</h2>
        {group.students.length === 0 ? (
          <p>В группе пока нет учеников.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ученик</th>
                  <th>Контакты</th>
                  <th>Статус</th>
                  <th>Действие</th>
                </tr>
              </thead>
              <tbody>
                {group.students.map((link) => (
                  <tr key={link.id}>
                    <td>
                      <Link href={`/admin/students/${link.student.id}`}>{link.student.name}</Link>
                    </td>
                    <td>{[link.student.phone, link.student.email].filter(Boolean).join(", ") || "Не указаны"}</td>
                    <td>{groupStudentStatusLabels[link.status]}</td>
                    <td>
                      {link.status === "active" ? (
                        <form action={removeStudentFromGroup.bind(null, link.id, group.id)}>
                          <button className="secondary-button" type="submit">
                            Убрать
                          </button>
                        </form>
                      ) : (
                        "История сохранена"
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
