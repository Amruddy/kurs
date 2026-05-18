import { InfoList, MetricGrid, SupabaseDataPage } from "@/app/components/supabase-data-page";
import { getStudentHomework } from "@/app/lib/data/supabase-read";
import { requireWorkspace } from "@/app/lib/dev-auth";

export default async function StudentHomeworkPage() {
  const session = await requireWorkspace("student");
  const result = await getStudentHomework(session.organizationId, session.email);

  return (
    <SupabaseDataPage
      title="Домашние задания"
      description="Активные задания ученика: групповые и индивидуальные."
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
            <h2>Задания</h2>
            <InfoList
              emptyText="Активных домашних заданий пока нет."
              items={data.homework.map((homework) => (
                <div className="info-row" key={homework.id}>
                  <span>
                    Срок: {homework.due}; {homework.context}
                  </span>
                  <strong>{homework.title}</strong>
                  <p>
                    {homework.description}
                    {homework.lesson !== "без связи с уроком" ? `; урок: ${homework.lesson}` : ""}
                  </p>
                  {homework.materials.length > 0 ? (
                    <p>
                      Материалы:{" "}
                      {homework.materials.map((material) =>
                        material.url ? (
                          <a href={material.url} key={material.id} rel="noreferrer" target="_blank">
                            {material.title}
                          </a>
                        ) : (
                          <span key={material.id}>{material.title}</span>
                        ),
                      )}
                    </p>
                  ) : null}
                </div>
              ))}
            />
          </section>
        </>
      )}
    </SupabaseDataPage>
  );
}
