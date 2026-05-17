import { InfoList, SupabaseDataPage } from "@/app/components/supabase-data-page";
import { getStudentOverview } from "@/app/lib/data/supabase-read";
import { requireWorkspace } from "@/app/lib/dev-auth";

export default async function StudentPage() {
  const session = await requireWorkspace("student");
  const result = await getStudentOverview(session.organizationId, session.email);

  return (
    <SupabaseDataPage
      title="Кабинет ученика"
      description="Короткая сводка ученика из Supabase: группа, ближайший урок, задания, материалы и оплата."
      result={result}
    >
      {(data) => (
        <section className="grid">
          <div className="panel">
            <h2>Группы</h2>
            <InfoList
              emptyText="Активные группы пока не назначены."
              items={data.groups.map((group) => (
                <div className="info-row" key={group}>
                  <strong>{group}</strong>
                </div>
              ))}
            />
          </div>

          <div className="panel">
            <h2>Ближайший урок</h2>
            {data.nextLesson ? (
              <div className="info-row">
                <span>{data.nextLesson.when}</span>
                <strong>{data.nextLesson.title}</strong>
                <p>{data.nextLesson.subtitle}</p>
              </div>
            ) : (
              <p className="empty-state">Ближайший урок пока не создан.</p>
            )}
          </div>

          <div className="panel">
            <h2>Домашние задания</h2>
            <InfoList
              emptyText="Домашних заданий пока нет."
              items={data.homework.map((item) => (
                <div className="info-row" key={item}>
                  <strong>{item}</strong>
                </div>
              ))}
            />
          </div>

          <div className="panel">
            <h2>Оплата</h2>
            <InfoList
              emptyText="Оплата пока не настроена."
              items={data.payments.map((payment) => (
                <div className="info-row" key={payment.id}>
                  <span>{payment.due}</span>
                  <strong>{payment.amount}</strong>
                  <p>{payment.status}</p>
                </div>
              ))}
            />
          </div>

          <div className="panel">
            <h2>Материалы</h2>
            <InfoList
              emptyText="Открытых материалов пока нет."
              items={data.materials.map((item) => (
                <div className="info-row" key={item}>
                  <strong>{item}</strong>
                </div>
              ))}
            />
          </div>

          <div className="panel">
            <h2>Прогресс</h2>
            <InfoList
              emptyText="Открытый прогресс пока не заполнен."
              items={data.progress.map((item) => (
                <div className="info-row" key={item}>
                  <strong>{item}</strong>
                </div>
              ))}
            />
          </div>
        </section>
      )}
    </SupabaseDataPage>
  );
}
