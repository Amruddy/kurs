import Link from "next/link";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { prisma } from "@/app/lib/prisma";

export default async function TeacherStudentsPage() {
  const session = await requireWorkspace("teacher");
  const links = await prisma.groupStudent.findMany({
    where: {
      status: "active",
      group: {
        organizationId: session.organizationId,
        teacherId: session.userId,
        status: { not: "archived" },
      },
    },
    include: {
      student: true,
      group: {
        include: { course: true },
      },
    },
    orderBy: { joinedAt: "desc" },
  });
  const groupCount = new Set(links.map((link) => link.groupId)).size;
  const studentsWithoutContacts = links.filter((link) => !link.student.phone && !link.student.email).length;

  return (
    <>
      <div className="page-heading">
        <h1>Мои ученики</h1>
      </div>

      <section className="panel">
        <div className="section-heading">
          <div>
            <span className="status">Список</span>
            <h2>Ученики преподавателя</h2>
          </div>
        </div>
        {links.length === 0 ? (
          <p>Пока нет активных учеников в ваших группах.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ученик</th>
                  <th>Группа</th>
                  <th>Курс</th>
                  <th>Контакты</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => (
                  <tr key={link.id}>
                    <td>
                      <Link href={`/teacher/students/${link.student.id}`}>{link.student.name}</Link>
                    </td>
                    <td>
                      <Link href={`/teacher/groups/${link.group.id}`}>{link.group.name}</Link>
                    </td>
                    <td>{link.group.course.name}</td>
                    <td>{[link.student.phone, link.student.email].filter(Boolean).join(", ") || "Не указаны"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="metric-grid section" aria-label="Сводка учеников преподавателя">
        <div className="panel metric-card">
          <span>Ученики</span>
          <strong>{links.length}</strong>
          <p>Активные записи в группах</p>
        </div>
        <div className="panel metric-card">
          <span>Группы</span>
          <strong>{groupCount}</strong>
          <p>Где есть ученики</p>
        </div>
        <div className="panel metric-card">
          <span>Контакты</span>
          <strong>{links.length - studentsWithoutContacts}</strong>
          <p>Телефон или email указан</p>
        </div>
        <div className="panel metric-card">
          <span>Без контактов</span>
          <strong>{studentsWithoutContacts}</strong>
          <p>Нужно уточнить данные</p>
        </div>
      </section>
    </>
  );
}
