import Link from "next/link";
import { archiveCourse, updateCourse } from "@/app/admin/actions";
import {
  courseFormatLabels,
  courseStatusLabels,
  groupStatusLabels,
  lessonMarkScaleLabels,
} from "@/app/lib/learning-labels";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { prisma } from "@/app/lib/prisma";

type AdminCoursePageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function AdminCoursePage({ params }: AdminCoursePageProps) {
  const { courseId } = await params;
  const session = await requireWorkspace("admin");
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      organizationId: session.organizationId,
    },
    include: {
      progressSettings: true,
      groups: {
        include: {
          teacher: true,
          students: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!course) {
    return (
      <section className="panel">
        <h1>Курс не найден</h1>
        <p>Курс не существует или относится к другой организации.</p>
      </section>
    );
  }

  return (
    <>
      <div className="page-heading">
        <span className="status">{courseStatusLabels[course.status]}</span>
        <h1>{course.name}</h1>
        <p>{course.description || "Описание пока не заполнено."}</p>
      </div>

      <section className="grid">
        <div className="panel">
          <h2>{courseFormatLabels[course.format]}</h2>
          <p>Формат обучения</p>
        </div>
        <div className="panel">
          <h2>{course.lessonMarkScale ? lessonMarkScaleLabels[course.lessonMarkScale] : "Нет"}</h2>
          <p>Шкала оценки</p>
        </div>
        <div className="panel">
          <h2>{course.progressSettings?.isProgressEnabled ? "Включен" : "Выключен"}</h2>
          <p>Таджвид-прогресс</p>
        </div>
      </section>

      <section className="panel section">
        <h2>Редактировать курс</h2>
        <form className="form-grid" action={updateCourse.bind(null, course.id)}>
          <label>
            Название
            <input name="name" required defaultValue={course.name} />
          </label>
          <label>
            Описание
            <input name="description" defaultValue={course.description ?? ""} />
          </label>
          <label>
            Формат
            <select name="format" defaultValue={course.format}>
              <option value="group">Группы</option>
              <option value="individual">Индивидуально</option>
              <option value="both">Группы и индивидуально</option>
            </select>
          </label>
          <label>
            Шкала оценки
            <select name="lessonMarkScale" defaultValue={course.lessonMarkScale ?? ""}>
              <option value="">Без оценки</option>
              <option value="five_point">5-балльная</option>
              <option value="ten_point">10-балльная</option>
            </select>
          </label>
          <label className="checkbox-label">
            <input
              name="isProgressEnabled"
              type="checkbox"
              defaultChecked={course.progressSettings?.isProgressEnabled ?? true}
            />
            Включить таджвид-прогресс
          </label>
          <button className="button" type="submit">
            Сохранить
          </button>
        </form>
      </section>

      <section className="panel section">
        <div className="section-heading">
          <h2>Группы курса</h2>
          <Link className="secondary-button link-button" href="/admin/groups">
            Создать группу
          </Link>
        </div>
        {course.groups.length === 0 ? (
          <p>К этому курсу еще не привязаны группы.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Группа</th>
                  <th>Преподаватель</th>
                  <th>Ученики</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {course.groups.map((group) => (
                  <tr key={group.id}>
                    <td>
                      <Link href={`/admin/groups/${group.id}`}>{group.name}</Link>
                    </td>
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

      {course.status === "active" ? (
        <form className="section" action={archiveCourse.bind(null, course.id)}>
          <button className="secondary-button" type="submit">
            Архивировать курс
          </button>
        </form>
      ) : null}
    </>
  );
}
