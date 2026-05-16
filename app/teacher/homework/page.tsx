import Link from "next/link";
import { PageCreateAction } from "@/app/components/page-create-action";
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
          <h1>Домашние задания</h1>
        </div>
        {groups.length > 0 ? (
          <PageCreateAction buttonLabel="Создать задание" title="Новое домашнее задание">
            <form className="form-grid" action={createTeacherHomework}>
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
              <button className="button" type="submit">
                Создать ДЗ
              </button>
            </form>
          </PageCreateAction>
        ) : null}
      </div>

      <section className="panel">
        <div className="section-heading">
          <div>
            <span className="status">Список</span>
            <h2>История заданий</h2>
          </div>
        </div>
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

      <section className="metric-grid section" aria-label="Сводка домашних заданий">
        <div className="panel metric-card">
          <span>Задания</span>
          <strong>{homeworks.length}</strong>
          <p>Активные записи</p>
        </div>
        <div className="panel metric-card">
          <span>Группы</span>
          <strong>{groups.length}</strong>
          <p>Доступны для задания</p>
        </div>
        <div className="panel metric-card">
          <span>Индивидуальные</span>
          <strong>{homeworks.filter((homework) => homework.studentId).length}</strong>
          <p>Для отдельных учеников</p>
        </div>
        <div className="panel metric-card">
          <span>Без срока</span>
          <strong>{homeworks.filter((homework) => !homework.dueAt).length}</strong>
          <p>Срок не указан</p>
        </div>
      </section>

      {groups.length === 0 ? (
        <section className="panel section">
          <p>Нет активных групп для домашних заданий.</p>
        </section>
      ) : null}
    </>
  );
}
