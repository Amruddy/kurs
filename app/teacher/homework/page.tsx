import Link from "next/link";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { prisma } from "@/app/lib/prisma";
import { createTeacherHomework } from "@/app/teacher/actions";

export default async function TeacherHomeworkPage() {
  const session = await requireWorkspace("teacher");
  const groups = await prisma.group.findMany({
    where: {
      organizationId: session.organizationId,
      teacherId: session.userId,
      status: { not: "archived" },
    },
    include: {
      course: true,
      students: {
        where: { status: "active" },
        include: { student: true },
        orderBy: { joinedAt: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
  const homeworks = await prisma.homework.findMany({
    where: {
      organizationId: session.organizationId,
      authorId: session.userId,
      status: "active",
    },
    include: {
      group: true,
      student: true,
      lesson: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <div className="page-heading page-heading-with-action">
        <div>
          <span className="status">Домашние задания</span>
          <h1>ДЗ преподавателя</h1>
          <p>Задания для ваших групп и отдельных учеников.</p>
        </div>
      </div>

      {groups.length > 0 ? (
        <form className="panel" action={createTeacherHomework}>
          <h2>Новое задание</h2>
          <p>Быстрое создание для выбранной группы.</p>
          <div className="form-grid">
            <label>
              Группа
              <select name="groupId" required>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Название
              <input name="title" required />
            </label>
            <label>
              Срок
              <input name="dueAt" type="date" />
            </label>
            <label>
              Ученик
              <select name="studentId">
                <option value="">Вся группа</option>
                {groups.flatMap((group) => group.students).map((link) => (
                  <option key={`${link.groupId}-${link.studentId}`} value={link.studentId}>
                    {link.student.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Текст
              <input name="text" required />
            </label>
            <label className="checkbox-label">
              <input name="isVisibleToStudent" type="checkbox" defaultChecked /> Видно ученику
            </label>
          </div>
          <button className="button compact-button section" type="submit">
            Создать ДЗ
          </button>
        </form>
      ) : (
        <section className="panel">
          <p>Нет активных групп для домашних заданий.</p>
        </section>
      )}

      <section className="panel section">
        <h2>История заданий</h2>
        {homeworks.length === 0 ? (
          <p>Домашние задания пока не созданы.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Задание</th>
                  <th>Группа</th>
                  <th>Ученик</th>
                  <th>Срок</th>
                  <th>Урок</th>
                </tr>
              </thead>
              <tbody>
                {homeworks.map((homework) => (
                  <tr key={homework.id}>
                    <td>{homework.title}</td>
                    <td>{homework.group?.name ?? "Группа"}</td>
                    <td>{homework.student?.name ?? "Вся группа"}</td>
                    <td>{homework.dueAt ? homework.dueAt.toLocaleDateString("ru-RU") : "Без срока"}</td>
                    <td>
                      {homework.lesson ? (
                        <Link href={`/teacher/lessons/${homework.lesson.id}`}>Открыть</Link>
                      ) : (
                        "Без урока"
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
