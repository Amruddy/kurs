import Link from "next/link";
import { createCourse } from "@/app/admin/actions";
import {
  courseFormatLabels,
  courseStatusLabels,
  lessonMarkScaleLabels,
} from "@/app/lib/learning-labels";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { prisma } from "@/app/lib/prisma";

export default async function AdminCoursesPage() {
  const session = await requireWorkspace("admin");
  const courses = await prisma.course.findMany({
    where: { organizationId: session.organizationId },
    include: {
      progressSettings: true,
      groups: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <div className="page-heading page-heading-with-action">
        <div>
          <span className="status">Курсы</span>
          <h1>Управление курсами</h1>
        </div>
        <details className="create-disclosure">
          <summary className="button">Создать курс</summary>
          <div className="panel create-panel">
            <form className="form-grid" action={createCourse}>
              <label>
                Название
                <input name="name" required placeholder="Таджвид для начинающих" />
              </label>
              <label>
                Описание
                <input name="description" placeholder="Краткое описание курса" />
              </label>
              <label>
                Формат
                <select name="format" defaultValue="group">
                  <option value="group">Группы</option>
                  <option value="individual">Индивидуально</option>
                  <option value="both">Группы и индивидуально</option>
                </select>
              </label>
              <label>
                Шкала оценки
                <select name="lessonMarkScale" defaultValue="">
                  <option value="">Без оценки</option>
                  <option value="five_point">5-балльная</option>
                  <option value="ten_point">10-балльная</option>
                </select>
              </label>
              <label className="checkbox-label">
                <input name="isProgressEnabled" type="checkbox" defaultChecked />
                Включить таджвид-прогресс
              </label>
              <button className="button" type="submit">
                Сохранить
              </button>
            </form>
          </div>
        </details>
      </div>

      <section className="panel">
        <h2>Список курсов</h2>
        {courses.length === 0 ? (
          <p>Курсов пока нет.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Формат</th>
                  <th>Оценка</th>
                  <th>Прогресс</th>
                  <th>Группы</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id}>
                    <td>
                      <Link href={`/admin/courses/${course.id}`}>{course.name}</Link>
                    </td>
                    <td>{courseFormatLabels[course.format]}</td>
                    <td>
                      {course.lessonMarkScale ? lessonMarkScaleLabels[course.lessonMarkScale] : "Нет"}
                    </td>
                    <td>{course.progressSettings?.isProgressEnabled ? "Включен" : "Выключен"}</td>
                    <td>{course.groups.length}</td>
                    <td>{courseStatusLabels[course.status]}</td>
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
