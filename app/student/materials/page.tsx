import { InfoList, MetricGrid, SupabaseDataPage } from "@/app/components/supabase-data-page";
import { getStudentMaterials } from "@/app/lib/data/supabase-read";
import { requireWorkspace } from "@/app/lib/dev-auth";

export default async function StudentMaterialsPage() {
  const session = await requireWorkspace("student");
  const result = await getStudentMaterials(session.organizationId, session.email);

  return (
    <SupabaseDataPage
      title="Материалы"
      description="Текстовые материалы и ссылки, которые преподаватель открыл ученику."
      result={result}
    >
      {(data) => (
        <>
          <section className="student-overview-grid">
            <div className="panel student-main-panel">
              <div className="section-heading">
                <div>
                  <h2>{data.studentName}</h2>
                  <p>{data.groups.join("; ") || "активные группы не найдены"}</p>
                </div>
              </div>
            </div>
          </section>

          <div className="section">
            <MetricGrid items={data.metrics} />
          </div>

          <section className="panel section">
            <h2>Открытые материалы</h2>
            <InfoList
              emptyText="Открытых материалов пока нет."
              items={data.materials.map((material) => (
                <div className="info-row" key={material.id}>
                  <span>{material.detail}</span>
                  {material.url ? (
                    <a href={material.url} rel="noreferrer" target="_blank">
                      {material.title}
                    </a>
                  ) : (
                    <strong>{material.title}</strong>
                  )}
                  {material.content ? <p>{material.content}</p> : null}
                </div>
              ))}
            />
          </section>
        </>
      )}
    </SupabaseDataPage>
  );
}
