import { DataTable, SupabaseDataPage } from "@/app/components/supabase-data-page";
import { getAdminStudents } from "@/app/lib/data/supabase-read";
import { requireWorkspace } from "@/app/lib/dev-auth";

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
