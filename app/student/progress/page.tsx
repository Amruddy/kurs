import { InfoList, SupabaseDataPage } from "@/app/components/supabase-data-page";
import { getStudentProgress } from "@/app/lib/data/supabase-read";
import { requireWorkspace } from "@/app/lib/dev-auth";

export default async function StudentProgressPage() {
  const session = await requireWorkspace("student");
  const result = await getStudentProgress(session.organizationId, session.email);

  return (
    <SupabaseDataPage
      title="Прогресс"
      description="Открытые преподавателем правила, ошибки и рекомендации по чтению."
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

              <div className="student-highlight">
                <span>Открытый прогресс</span>
                <strong>{data.rules.length + data.errors.length + data.records.length}</strong>
                <p>Показаны только данные, которые преподаватель открыл для ученика.</p>
              </div>
            </div>

            <aside className="panel student-side-panel">
              <h2>Что смотреть</h2>
              <p>
                Правила показывают текущий уровень по теме. Ошибки и записи помогают понять, что повторить к
                следующему уроку.
              </p>
            </aside>
          </section>

          <section className="student-progress-grid section">
            <div className="panel">
              <h2>Правила</h2>
              <InfoList
                emptyText="Преподаватель пока не открыл правила прогресса."
                items={data.rules.map((rule) => (
                  <div className="info-row" key={rule.id}>
                    <span>{rule.course}</span>
                    <strong>{rule.name}</strong>
                    <p>
                      Уровень: {rule.level}
                      {rule.note ? `; ${rule.note}` : ""}
                    </p>
                  </div>
                ))}
              />
            </div>

            <div className="panel">
              <h2>Ошибки и замечания</h2>
              <InfoList
                emptyText="Открытых ошибок и замечаний пока нет."
                items={data.errors.map((error) => (
                  <div className="info-row" key={error.id}>
                    <span>{error.course}</span>
                    <strong>{error.name}</strong>
                    {error.note ? <p>{error.note}</p> : null}
                  </div>
                ))}
              />
            </div>
          </section>

          <section className="panel section">
            <h2>Что повторить</h2>
            <InfoList
              emptyText="Открытых записей прогресса пока нет."
              items={data.records.map((record) => (
                <div className="info-row" key={record.id}>
                  <span>
                    {record.createdAt}; {record.course}
                  </span>
                  <strong>{record.repeatNote || "Повторение не указано"}</strong>
                  <p>
                    {record.lesson}
                    {record.studentComment ? `; ${record.studentComment}` : ""}
                  </p>
                </div>
              ))}
            />
          </section>
        </>
      )}
    </SupabaseDataPage>
  );
}
