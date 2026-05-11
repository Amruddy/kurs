import Link from "next/link";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { prisma } from "@/app/lib/prisma";

export default async function AdminPage() {
  const session = await requireWorkspace("admin");
  const [coursesCount, groupsCount, studentsCount, teachersCount] = await Promise.all([
    prisma.course.count({ where: { organizationId: session.organizationId } }),
    prisma.group.count({ where: { organizationId: session.organizationId } }),
    prisma.student.count({ where: { organizationId: session.organizationId } }),
    prisma.organizationMember.count({
      where: {
        organizationId: session.organizationId,
        status: "active",
        roles: { has: "teacher" },
      },
    }),
  ]);

  return (
    <>
      <div className="page-heading">
        <span className="status">Stage 2</span>
        <h1>Административная область</h1>
        <p>
          Учебная основа организации: курсы, преподаватели, ученики и группы. Расписание, уроки,
          журнал и оплаты будут добавлены на следующих этапах MVP.
        </p>
      </div>

      <section className="grid">
        <div className="panel">
          <h2>{coursesCount}</h2>
          <p>Курсов</p>
        </div>
        <div className="panel">
          <h2>{groupsCount}</h2>
          <p>Групп</p>
        </div>
        <div className="panel">
          <h2>{studentsCount}</h2>
          <p>Учеников</p>
        </div>
        <div className="panel">
          <h2>{teachersCount}</h2>
          <p>Преподавателей</p>
        </div>
      </section>

      <section className="panel section">
        <h2>Разделы</h2>
        <div className="action-grid">
          <Link className="secondary-button link-button" href="/admin/courses">
            Курсы
          </Link>
          <Link className="secondary-button link-button" href="/admin/groups">
            Группы
          </Link>
          <Link className="secondary-button link-button" href="/admin/students">
            Ученики
          </Link>
          <Link className="secondary-button link-button" href="/admin/teachers">
            Преподаватели
          </Link>
        </div>
      </section>
    </>
  );
}
