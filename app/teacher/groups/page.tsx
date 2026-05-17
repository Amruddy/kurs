import { DataTable, SupabaseDataPage } from "@/app/components/supabase-data-page";
import { getTeacherGroups } from "@/app/lib/data/supabase-read";
import { requireWorkspace } from "@/app/lib/dev-auth";

export default async function TeacherGroupsPage() {
  const session = await requireWorkspace("teacher");
  const result = await getTeacherGroups(session.organizationId, session.email);

  return (
    <SupabaseDataPage
      title="Группы преподавателя"
      description="Только группы, где текущий seed-пользователь назначен преподавателем."
      result={result}
    >
      {(data) => (
        <section className="panel">
          <DataTable
            rows={data.groups}
            keyForRow={(group) => group.id}
            emptyText="За преподавателем пока нет групп."
            columns={[
              { header: "Группа", render: (group) => <strong>{group.name}</strong> },
              { header: "Курс", render: (group) => group.course },
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
