import { requireWorkspace } from "@/app/lib/dev-auth";
import { progressLevelLabels } from "@/app/lib/learning-labels";
import { prisma } from "@/app/lib/prisma";

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
          where: { organizationId: session.organizationId, studentId: student.id },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
      ])
    : [[], [], []];

  return (
    <>
      <div className="page-heading">
        <span className="status">Прогресс</span>
        <h1>Мой прогресс</h1>
        <p>Видны только данные, открытые преподавателем.</p>
      </div>

      <section className="grid">
        <div className="panel">
          <h2>{rules.length}</h2>
          <p>Открытых правил</p>
        </div>
        <div className="panel">
          <h2>{errors.length}</h2>
          <p>Открытых ошибок</p>
        </div>
        <div className="panel">
          <h2>{records.length}</h2>
          <p>Записей прогресса</p>
        </div>
      </section>

      <section className="grid section">
        <div className="panel">
          <h2>Правила</h2>
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
        <div className="panel">
          <h2>Ошибки</h2>
          {errors.length === 0 ? (
            <p>Ошибки пока не открыты.</p>
          ) : (
            <ul className="muted-list">
              {errors.map((error) => (
                <li key={error.id}>
                  {error.name}
                  {error.isRepeated ? " (повторяется)" : ""}
                  {error.note ? ` - ${error.note}` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="panel section">
        <h2>Что повторить и комментарии</h2>
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
                    <td>{record.createdAt.toLocaleDateString("ru-RU")}</td>
                    <td>{record.showRepeatText ? record.repeatText ?? "Не указано" : "Скрыто"}</td>
                    <td>
                      {record.showStudentComment
                        ? record.studentComment ?? "Без комментария"
                        : "Скрыто"}
                    </td>
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
