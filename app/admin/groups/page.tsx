import { DataTable, SupabaseDataPage } from "@/app/components/supabase-data-page";
import { getAdminGroups } from "@/app/lib/data/supabase-read";
import { requireWorkspace } from "@/app/lib/dev-auth";

export default async function AdminGroupsPage() {
  const session = await requireWorkspace("admin");
  const result = await getAdminGroups(session.organizationId);

  return (
    <SupabaseDataPage
      title="Группы"
      description="Группы, преподаватели, состав и ближайшие занятия из Supabase."
      result={result}
    >
      {(data) => (
        <section className="panel">
          <DataTable
            rows={data.groups}
            keyForRow={(group) => group.id}
            emptyText="Группы еще не созданы."
            columns={[
              { header: "Группа", render: (group) => <strong>{group.name}</strong> },
              { header: "Курс", render: (group) => group.course },
              { header: "Преподаватель", render: (group) => group.teacher },
              { header: "Ученики", render: (group) => group.students },
              { header: "Следующее занятие", render: (group) => group.nextLesson },
              { header: "Статус", render: (group) => group.status },
            ]}
          />
        </section>
      )}
    </SupabaseDataPage>
  );
}
