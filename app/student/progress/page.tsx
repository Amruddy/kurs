import { SupabaseDataPage } from "@/app/components/supabase-data-page";
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
        <div className="student-dashboard">
          <section className="student-compact-grid">
            <article className="panel student-compact-card">
              <h2>Правила</h2>
              <strong>{data.rules.length}</strong>
            </article>
            <article className="panel student-compact-card">
              <h2>Ошибки</h2>
              <strong>{data.errors.length}</strong>
            </article>
            <article className="panel student-compact-card">
              <h2>Что повторить</h2>
              <strong>{data.records.length}</strong>
            </article>
          </section>

          <section className="student-learning-grid">
            <div className="student-learning-column">
              <h2>Правила</h2>
              {data.rules.length > 0 ? (
                <div className="student-detail-list">
                  {data.rules.map((rule) => (
                    <article className="panel student-detail-card" key={rule.id}>
                      <span className="student-card-meta">{rule.course}</span>
                      <strong>{rule.name}</strong>
                      <p>
                        Уровень: {rule.level}
                        {rule.note ? `; ${rule.note}` : ""}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="empty-state">Преподаватель пока не открыл правила прогресса.</p>
              )}
            </div>

            <div className="student-learning-column">
              <h2>Ошибки и замечания</h2>
              {data.errors.length > 0 ? (
                <div className="student-detail-list">
                  {data.errors.map((error) => (
                    <article className="panel student-detail-card" key={error.id}>
                      <span className="student-card-meta">{error.course}</span>
                      <strong>{error.name}</strong>
                      {error.note ? <p>{error.note}</p> : null}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="empty-state">Открытых ошибок и замечаний пока нет.</p>
              )}
            </div>
          </section>

          <section className="student-learning-column">
            <h2>Что повторить</h2>
            {data.records.length > 0 ? (
              <div className="student-detail-list">
                {data.records.map((record) => (
                  <article className="panel student-detail-card" key={record.id}>
                    <span className="student-card-meta">
                      {record.createdAt}; {record.course}
                    </span>
                    <strong>{record.repeatNote || "Повторение не указано"}</strong>
                    <p>
                      {record.lesson}
                      {record.studentComment ? `; ${record.studentComment}` : ""}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="empty-state">Открытых записей прогресса пока нет.</p>
            )}
          </section>
        </div>
      )}
    </SupabaseDataPage>
  );
}
