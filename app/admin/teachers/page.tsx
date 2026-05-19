import { createTeacher } from "@/app/admin/actions";
import { PageCreateAction } from "@/app/components/page-create-action";
import { DataTable, MetricGrid, SupabaseDataPage } from "@/app/components/supabase-data-page";
import { getAdminTeachers } from "@/app/lib/data/supabase-read";
import { requireWorkspace } from "@/app/lib/dev-auth";

export default async function AdminTeachersPage() {
  const session = await requireWorkspace("admin");
  const result = await getAdminTeachers(session.organizationId);

  return (
    <SupabaseDataPage
      title="Преподаватели"
      description="Преподаватели организации, назначенные группы, ученики и ближайшая нагрузка."
      result={result}
    >
      {(data) => (
        <>
          <MetricGrid items={data.metrics} />

          <section className="panel section">
            <div className="section-heading">
              <h2>Список преподавателей</h2>
              <PageCreateAction buttonLabel="Добавить преподавателя" title="Новый преподаватель">
                <form action={createTeacher} className="form-grid">
                  <label>
                    Имя
                    <input name="name" required placeholder="Имя преподавателя" />
                  </label>
                  <label>
                    Email
                    <input name="email" type="email" required placeholder="teacher@example.com" />
                  </label>
                  <label>
                    Телефон
                    <input name="phone" placeholder="+7 ..." />
                  </label>
                  <button className="button compact-button" type="submit">
                    Сохранить преподавателя
                  </button>
                </form>
              </PageCreateAction>
            </div>

            <DataTable
              rows={data.teachers}
              keyForRow={(teacher) => teacher.id}
              emptyText="Преподаватели еще не добавлены."
              columns={[
                { header: "Преподаватель", render: (teacher) => <strong>{teacher.name}</strong> },
                { header: "Контакты", render: (teacher) => teacher.contacts },
                { header: "Группы", render: (teacher) => teacher.groups },
                { header: "Активные", render: (teacher) => teacher.activeGroups },
                { header: "Ученики", render: (teacher) => teacher.students },
                { header: "Ближайшие уроки", render: (teacher) => teacher.upcomingLessons },
                { header: "Статус", render: (teacher) => teacher.status },
              ]}
            />
          </section>
        </>
      )}
    </SupabaseDataPage>
  );
}
