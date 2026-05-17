import { DataTable, SupabaseDataPage } from "@/app/components/supabase-data-page";
import { getAdminCourses } from "@/app/lib/data/supabase-read";
import { requireWorkspace } from "@/app/lib/dev-auth";

export default async function AdminCoursesPage() {
  const session = await requireWorkspace("admin");
  const result = await getAdminCourses(session.organizationId);

  return (
    <SupabaseDataPage
      title="Курсы"
      description="Минимальный список курсов из Supabase dev-проекта."
      result={result}
    >
      {(data) => (
        <section className="panel">
          <DataTable
            rows={data.courses}
            keyForRow={(course) => course.id}
            emptyText="Курсы еще не созданы."
            columns={[
              { header: "Курс", render: (course) => <strong>{course.name}</strong> },
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
