import Link from "next/link";
import { DataTable, SupabaseDataPage } from "@/app/components/supabase-data-page";
import { PageCreateAction } from "@/app/components/page-create-action";
import { getAdminCourses } from "@/app/lib/data/supabase-read";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { createCourse } from "@/app/admin/actions";

export default async function AdminCoursesPage() {
  const session = await requireWorkspace("admin");
  const result = await getAdminCourses(session.organizationId);

  return (
    <SupabaseDataPage
      title="Курсы"
      description="Курсы организации, формат обучения, статус и переходы в рабочие карточки курса."
      result={result}
    >
      {(data) => (
        <section className="panel">
          <div className="section-heading">
            <h2>Список курсов</h2>
            <PageCreateAction buttonLabel="Создать курс" title="Новый курс">
              <form action={createCourse} className="form-grid">
                <label>
                  Название
                  <input name="name" required placeholder="Например: Таджвид для начинающих" />
                </label>
                <label>
                  Описание
                  <input name="description" placeholder="Короткое описание курса" />
                </label>
                <label>
                  Формат
                  <select name="format" required defaultValue="group">
                    <option value="group">Группы</option>
                    <option value="individual">Индивидуально</option>
                    <option value="both">Группы и индивидуально</option>
                  </select>
                </label>
                <label>
                  Шкала оценок
                  <select name="lessonMarkScale" required defaultValue="five_point">
                    <option value="five_point">5-балльная</option>
                    <option value="ten_point">10-балльная</option>
                  </select>
                </label>
                <button className="button" type="submit">
                  Сохранить курс
                </button>
              </form>
            </PageCreateAction>
          </div>
          <DataTable
            rows={data.courses}
            keyForRow={(course) => course.id}
            emptyText="Курсы еще не созданы."
            columns={[
              {
                header: "Курс",
                render: (course) => (
                  <Link href={`/admin/courses/${course.id}`}>
                    <strong>{course.name}</strong>
                  </Link>
                ),
              },
              { header: "Описание", render: (course) => course.description },
              { header: "Формат", render: (course) => course.format },
              { header: "Группы", render: (course) => course.groupCount },
              { header: "Статус", render: (course) => course.status },
            ]}
          />
        </section>
      )}
    </SupabaseDataPage>
  );
}
