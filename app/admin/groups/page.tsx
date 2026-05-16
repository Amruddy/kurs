import Link from "next/link";
import { Role } from "@prisma/client";
import { createGroup } from "@/app/admin/actions";
import { PageCreateAction } from "@/app/components/page-create-action";
import { groupStatusLabels } from "@/app/lib/learning-labels";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { prisma } from "@/app/lib/prisma";

type AdminGroupsPageProps = {
  searchParams?: Promise<{ courseId?: string }>;
};

export default async function AdminGroupsPage({ searchParams }: AdminGroupsPageProps) {
  const session = await requireWorkspace("admin");
  const selectedCourseId = (await searchParams)?.courseId ?? "";
  const [groups, courses, teachers] = await Promise.all([
    prisma.group.findMany({
      where: { organizationId: session.organizationId },
      include: {
        course: true,
        teacher: true,
        students: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.course.findMany({
      where: {
        organizationId: session.organizationId,
        status: "active",
      },
      orderBy: { name: "asc" },
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
  ]);

  return (
    <>
      <div className="page-heading page-heading-with-action">
        <div>
          <span className="status">Группы</span>
          <h1>Управление группами</h1>
          <p>Сначала виден список групп. Новую группу можно создать из действия рядом с заголовком.</p>
        </div>
        <PageCreateAction buttonLabel="Создать группу" title="Новая группа" defaultOpen={Boolean(selectedCourseId)}>
          <form className="form-grid" action={createGroup}>
            <label>
              Название
              <input name="name" required placeholder="Таджвид, начинающие" />
            </label>
            <label>
              Курс
              <select name="courseId" required defaultValue={selectedCourseId}>
                <option value="" disabled>
                  Выберите курс
                </option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Преподаватель
              <select name="teacherId" defaultValue="">
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
              <select name="status" defaultValue="recruiting">
                <option value="recruiting">Набор</option>
                <option value="active">Активная</option>
                <option value="paused">Приостановлена</option>
                <option value="completed">Завершена</option>
                <option value="archived">Архивная</option>
              </select>
            </label>
            <button className="button" type="submit" disabled={courses.length === 0}>
              Создать группу
            </button>
          </form>
          {courses.length === 0 ? <p className="form-note">Сначала создайте курс.</p> : null}
          <p className="form-note">Оплату группе можно создать в карточке группы после добавления учеников.</p>
        </PageCreateAction>
      </div>

      <section className="panel">
        <h2>Список групп</h2>
        {groups.length === 0 ? (
          <p className="empty-state">Групп пока нет.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Группа</th>
                  <th>Курс</th>
                  <th>Преподаватель</th>
                  <th>Ученики</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <tr key={group.id}>
                    <td>
                      <Link href={`/admin/groups/${group.id}`}>{group.name}</Link>
                    </td>
                    <td>{group.course.name}</td>
                    <td>{group.teacher?.name ?? "Не назначен"}</td>
                    <td>{group.students.filter((student) => student.status === "active").length}</td>
                    <td>{groupStatusLabels[group.status]}</td>
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
