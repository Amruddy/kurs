import { DataTable, SupabaseDataPage } from "@/app/components/supabase-data-page";
import { PageCreateAction } from "@/app/components/page-create-action";
import { getAdminStudents } from "@/app/lib/data/supabase-read";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { createStudent } from "@/app/admin/actions";

export default async function AdminStudentsPage() {
  const session = await requireWorkspace("admin");
  const result = await getAdminStudents(session.organizationId);

  return (
    <SupabaseDataPage
      title="Ученики"
      description="Учебные карточки учеников и базовый статус оплаты из Supabase."
      result={result}
    >
      {(data) => (
        <section className="panel">
          <div className="section-heading">
            <h2>Список учеников</h2>
            <PageCreateAction buttonLabel="Добавить ученика" title="Новый ученик">
              <form action={createStudent} className="form-grid">
                <label>
                  Имя
                  <input name="name" required placeholder="Имя ученика" />
                </label>
                <label>
                  Телефон
                  <input name="phone" placeholder="+7 ..." />
                </label>
                <label>
                  Email
                  <input name="email" type="email" placeholder="student@example.com" />
                </label>
                <button className="button" type="submit">
                  Сохранить ученика
                </button>
              </form>
            </PageCreateAction>
          </div>
          <DataTable
            rows={data.students}
            keyForRow={(student) => student.id}
            emptyText="Ученики еще не созданы."
            columns={[
              { header: "Ученик", render: (student) => <strong>{student.name}</strong> },
              { header: "Контакты", render: (student) => student.contacts },
              { header: "Группы", render: (student) => student.groups },
              { header: "Оплата", render: (student) => student.payment },
              { header: "Статус", render: (student) => student.status },
            ]}
          />
        </section>
      )}
    </SupabaseDataPage>
  );
}
