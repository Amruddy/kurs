import Link from "next/link";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { materialStatusLabels, materialTypeLabels } from "@/app/lib/learning-labels";
import { prisma } from "@/app/lib/prisma";
import { createTeacherMaterial } from "@/app/teacher/actions";

export default async function TeacherMaterialsPage() {
  const session = await requireWorkspace("teacher");
  const groups = await prisma.group.findMany({
    where: {
      organizationId: session.organizationId,
      teacherId: session.userId,
      status: { not: "archived" },
    },
    include: { course: true },
    orderBy: { name: "asc" },
  });
  const materials = await prisma.material.findMany({
    where: {
      organizationId: session.organizationId,
      authorId: session.userId,
    },
    include: {
      group: true,
      lesson: true,
      homework: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <div className="page-heading">
        <span className="status">Материалы</span>
        <h1>Учебные материалы</h1>
        <p>Тексты и ссылки для групп, уроков и домашних заданий.</p>
      </div>

      {groups.length > 0 ? (
        <form className="panel" action={createTeacherMaterial}>
          <h2>Новый материал</h2>
          <p>Быстрое добавление к выбранной группе.</p>
          <div className="form-grid">
            <label>
              Куда добавить
              <select name="groupId" required>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Текст или ссылка
              <input name="material" required placeholder="Вставьте ссылку или короткий текст" />
            </label>
            <label className="checkbox-label">
              <input name="isVisibleToStudent" type="checkbox" defaultChecked /> Видно ученику
            </label>
          </div>
          <button className="button compact-button section" type="submit">
            Добавить
          </button>
        </form>
      ) : (
        <section className="panel">
          <p>Нет активных групп для материалов.</p>
        </section>
      )}

      <section className="panel section">
        <h2>Список материалов</h2>
        {materials.length === 0 ? (
          <p>Материалы пока не добавлены.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Материал</th>
                  <th>Тип</th>
                  <th>Привязка</th>
                  <th>Видимость</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((material) => (
                  <tr key={material.id}>
                    <td>{material.url ? <a href={material.url}>{material.title}</a> : material.title}</td>
                    <td>{materialTypeLabels[material.type]}</td>
                    <td>
                      {material.lesson ? (
                        <Link href={`/teacher/lessons/${material.lesson.id}`}>Урок</Link>
                      ) : material.homework ? (
                        "Домашнее задание"
                      ) : (
                        material.group?.name ?? "Курс"
                      )}
                    </td>
                    <td>{material.isVisibleToStudent ? "Видно" : "Скрыто"}</td>
                    <td>{materialStatusLabels[material.status]}</td>
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
