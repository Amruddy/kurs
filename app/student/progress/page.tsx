import { requireWorkspace } from "@/app/lib/dev-auth";
import { progressLevelLabels } from "@/app/lib/learning-labels";
import { prisma } from "@/app/lib/prisma";

function formatDate(date: Date) {
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function StudentProgressPage() {
  const session = await requireWorkspace("student");
  const student = await prisma.student.findFirst({
    where: { organizationId: session.organizationId, userId: session.userId },
  });
  const [rules, errors, records] = student
    ? await Promise.all([
        prisma.studentProgressRule.findMany({
          where: {
            organizationId: session.organizationId,
            studentId: student.id,
            isActive: true,
            isVisibleToStudent: true,
          },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        }),
        prisma.studentProgressError.findMany({
          where: {
            organizationId: session.organizationId,
            studentId: student.id,
            isActive: true,
            isVisibleToStudent: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.progressRecord.findMany({
          where: {
            organizationId: session.organizationId,
            studentId: student.id,
            OR: [{ showRepeatText: true }, { showStudentComment: true }],
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
      ])
    : [[], [], []];
  const repeatedErrorsCount = errors.filter((error) => error.isRepeated).length;
  const latestRecord = records[0] ?? null;

  return (
    <>
      <div className="page-heading">
        <h1>Прогресс</h1>
      </div>

      <section className="metric-grid" aria-label="Сводка прогресса">
        <div className="panel metric-card">
          <span>Правила</span>
          <strong>{rules.length}</strong>
          <p>Открыто преподавателем</p>
        </div>
        <div className="panel metric-card">
          <span>Ошибки</span>
          <strong>{errors.length}</strong>
          <p>Видимые замечания</p>
        </div>
        <div className="panel metric-card">
          <span>Повторяется</span>
          <strong>{repeatedErrorsCount}</strong>
          <p>Ошибки с повтором</p>
        </div>
        <div className="panel metric-card">
          <span>Записи</span>
          <strong>{records.length}</strong>
          <p>Что повторить и комментарии</p>
        </div>
      </section>

      <section className="student-overview-grid section">
        <div className="panel student-main-panel">
          <span className="status">Правила</span>
          <h2>Что получается</h2>
          <div className="student-progress-grid">
            <div>
              <h3>Правила</h3>
              {rules.length === 0 ? (
                <p>Правила пока не открыты.</p>
              ) : (
                <ul className="muted-list">
                  {rules.map((rule) => (
                    <li key={rule.id}>
                      {rule.name}
                      {rule.level ? `: ${progressLevelLabels[rule.level]}` : ""}
                      {rule.note ? ` - ${rule.note}` : ""}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3>Ошибки</h3>
              {errors.length === 0 ? (
                <p>Ошибки пока не открыты.</p>
              ) : (
                <ul className="muted-list">
                  {errors.map((error) => (
                    <li key={error.id}>
                      {error.name}
                      {error.isRepeated ? " - повторяется" : ""}
                      {error.note ? ` - ${error.note}` : ""}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <aside className="panel student-side-panel">
          <span className="status">Повторить</span>
          <h2>Последняя запись</h2>
          {latestRecord ? (
            <div className="student-list">
              <article className="student-list-item compact">
                <strong>{formatDate(latestRecord.createdAt)}</strong>
                <p>{latestRecord.showRepeatText ? latestRecord.repeatText ?? "Повтор не указан" : "Повтор скрыт"}</p>
                <span>
                  {latestRecord.showStudentComment ? latestRecord.studentComment ?? "Без комментария" : "Комментарий скрыт"}
                </span>
              </article>
            </div>
          ) : (
            <p>Прогресс еще не открыт.</p>
          )}
        </aside>
      </section>

      <section className="panel section">
        <div className="section-heading">
          <div>
            <span className="status">История</span>
            <h2>Что повторить и комментарии</h2>
          </div>
        </div>
        {records.length === 0 ? (
          <p>Прогресс еще не открыт.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Повтор</th>
                  <th>Комментарий</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>{formatDate(record.createdAt)}</td>
                    <td>{record.showRepeatText ? record.repeatText ?? "Не указано" : "Скрыто"}</td>
                    <td>{record.showStudentComment ? record.studentComment ?? "Без комментария" : "Скрыто"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
